import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function AdminError() {
  const router = useRouter();
  return <div role="alert" className="space-y-4 py-12 text-center"><p>تعذر تحميل البيانات.</p><Button onClick={() => router.invalidate()}>إعادة المحاولة</Button></div>;
}
export function AdminNotFound() { return <p className="py-12 text-center">الصفحة غير موجودة.</p>; }