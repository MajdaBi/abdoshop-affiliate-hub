import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ABDO SHOP — منصة الأفلييت" },
      { name: "description", content: "سجّل كأفلييت مع ABDO SHOP: اطلب المنتجات لزبنائك وتابع عمولاتك بسهولة." },
      { property: "og:title", content: "ABDO SHOP — منصة الأفلييت" },
      { property: "og:description", content: "اطلب المنتجات لزبنائك وتابع عمولاتك بسهولة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const pics = ["/images/bag.jpg", "/images/heels.jpg", "/images/sandals.jpg", "/images/clutch.jpg"];

function Index() {
  return (
    <div dir="rtl" className="min-h-screen bg-hero text-primary-foreground">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 md:grid-cols-2 md:py-24">
        <div>
          <p className="text-sm tracking-[0.3em] text-accent">AFFILIATE PLATFORM</p>
          <h1 className="mt-3 text-5xl font-bold md:text-6xl">ABDO SHOP</h1>
          <p className="mt-4 max-w-md text-lg text-primary-foreground/80">
            صيفط الطلبات ديال الزبناء ديالك، تابع الحالة ديالها، وشوف العمولة ديالك — كلشي فبلاصة وحدة.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="gold" size="lg"><Link to="/auth">تسجيل الدخول</Link></Button>
            <Button asChild variant="outline" size="lg" className="bg-transparent">
              <Link to="/auth" search={{ mode: "register" }}>إنشاء حساب</Link>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {pics.map((p, i) => (
            <img key={p} src={p} alt="" width={400} height={400} className={`aspect-square rounded-2xl object-cover shadow-soft ${i % 2 ? "translate-y-6" : ""}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
