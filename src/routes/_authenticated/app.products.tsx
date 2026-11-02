import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/StatusBadge";
import { productsQuery } from "@/lib/queries";
import { dh } from "@/lib/commission";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/app/products")({ head: () => pageHead("المنتجات", "منتجات ABDO SHOP المتوفرة وأسعارها وعمولاتها."), component: Products });

function Products() {
  const { data = [] } = useQuery(productsQuery);
  return (
    <>
      <PageTitle title="المنتجات" sub="المنتجات المتوفرة للبيع" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.filter((p) => p.active).map((p) => (
          <div key={p.id} className="overflow-hidden rounded-xl border bg-card shadow-soft">
            {p.image_url && <img src={p.image_url} alt={p.name} loading="lazy" width={400} height={400} className="aspect-square w-full object-cover" />}
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-bold">{p.name}</h3>
                <span className="text-xs text-success">متوفر</span>
              </div>
              <p className="text-sm text-muted-foreground">{p.description}</p>
              <div className="flex justify-between text-sm">
                <span className="font-bold">{dh(p.price)}</span>
                <span className="text-success">عمولة: {dh(p.commission)}</span>
              </div>
              {p.colors.length > 0 && <p className="text-xs">الألوان: {p.colors.join("، ")}</p>}
              {p.sizes.length > 0 && <p className="text-xs">المقاسات: {p.sizes.join("، ")}</p>}
              <Button asChild className="w-full"><Link to="/app/new-order" search={{ product: p.id }}>طلب هاد المنتج</Link></Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
