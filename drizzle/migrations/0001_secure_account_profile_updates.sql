CREATE OR REPLACE FUNCTION public.protect_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Account identity cannot be changed';
  END IF;
  IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    NEW.full_name := btrim(NEW.full_name);
    IF char_length(NEW.full_name) < 2 OR char_length(NEW.full_name) > 100 THEN
      RAISE EXCEPTION 'Invalid full name';
    END IF;
  END IF;
  IF NEW.phone IS DISTINCT FROM OLD.phone THEN
    NEW.phone := btrim(NEW.phone);
    IF char_length(NEW.phone) < 8 OR char_length(NEW.phone) > 20 OR NEW.phone !~ '^[+0-9 ()-]+$' THEN
      RAISE EXCEPTION 'Invalid phone number';
    END IF;
  END IF;
  IF NOT public.has_role(auth.uid(),'admin') THEN
    NEW.active := OLD.active;
  END IF;
  SELECT COALESCE(email, '') INTO NEW.email FROM auth.users WHERE id = OLD.id;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.sync_confirmed_profile_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET email = COALESCE(NEW.email, '') WHERE id = NEW.id;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.sync_confirmed_profile_email() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_email_updated AFTER UPDATE OF email ON auth.users
FOR EACH ROW WHEN (OLD.email IS DISTINCT FROM NEW.email)
EXECUTE FUNCTION public.sync_confirmed_profile_email();