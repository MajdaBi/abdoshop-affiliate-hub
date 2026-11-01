CREATE TYPE public.app_role AS ENUM ('admin','affiliate');
CREATE TYPE public.order_status AS ENUM ('pending','confirmed','shipped','delivered','cancelled');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profile update own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profile admin update" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- prevent affiliates from changing their own active flag / email
CREATE OR REPLACE FUNCTION public.protect_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    NEW.active := OLD.active;
    NEW.email := OLD.email;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER protect_profile BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), COALESCE(NEW.email,''), COALESCE(NEW.raw_user_meta_data->>'phone',''));
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'affiliate');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  commission numeric(10,2) NOT NULL DEFAULT 0,
  colors text[] NOT NULL DEFAULT '{}',
  sizes text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products read" ON public.products FOR SELECT TO authenticated USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE SEQUENCE public.order_number_seq;
GRANT USAGE ON SEQUENCE public.order_number_seq TO authenticated, service_role;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('ABDO-' || lpad(nextval('public.order_number_seq')::text, 5, '0')),
  affiliate_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  city text NOT NULL,
  address text NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  color text NOT NULL DEFAULT '',
  size text NOT NULL DEFAULT '',
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selling_price numeric(10,2) NOT NULL CHECK (selling_price >= 0),
  commission numeric(10,2) NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders read" ON public.orders FOR SELECT TO authenticated
  USING (affiliate_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders insert own" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (affiliate_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.active));
CREATE POLICY "orders admin update" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders admin delete" ON public.orders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.order_before_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c numeric;
BEGIN
  SELECT commission INTO c FROM public.products WHERE id = NEW.product_id AND active;
  IF c IS NULL THEN RAISE EXCEPTION 'Product not available'; END IF;
  NEW.status := 'pending';
  IF NOT public.has_role(auth.uid(),'admin') THEN
    NEW.affiliate_id := auth.uid();
    NEW.commission := c * NEW.quantity;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER order_before_insert BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.order_before_insert();

INSERT INTO public.products (name, description, image_url, price, commission, colors, sizes) VALUES
('Sac Élégance', 'Sac à main en cuir synthétique, grand format, idéal pour le quotidien.', '/images/bag.jpg', 180, 30, ARRAY['Noir','Beige','Marron'], '{}'),
('Escarpins Rosa', 'Escarpins à talon 7cm, confortables et chics.', '/images/heels.jpg', 220, 35, ARRAY['Nude','Noir'], ARRAY['36','37','38','39','40']),
('Sandales Été', 'Sandales plates tressées, légères pour l''été.', '/images/sandals.jpg', 140, 20, ARRAY['Camel','Blanc'], ARRAY['36','37','38','39','40','41']),
('Pochette Soirée', 'Petite pochette dorée avec chaîne amovible.', '/images/clutch.jpg', 120, 20, ARRAY['Doré','Argenté'], '{}');