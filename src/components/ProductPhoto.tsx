import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import type { ImgHTMLAttributes } from "react";
import { resolveProductPhoto } from "@/lib/product-photo";

export function ProductPhoto({ reference, alt, ...props }: ImgHTMLAttributes<HTMLImageElement> & { reference: string }) {
  const { data } = useQuery({
    queryKey: ["product-photo", reference],
    queryFn: () => resolveProductPhoto(reference),
    enabled: Boolean(reference),
    staleTime: 30 * 60 * 1000,
    refetchInterval: 45 * 60 * 1000,
  });
  if (!data) return <div className="flex aspect-square items-center justify-center bg-muted"><Package className="size-12 text-muted-foreground" /></div>;
  return <img {...props} src={data} alt={alt} />;
}