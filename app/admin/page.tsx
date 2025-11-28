// app/admin/page.tsx
import { redirect } from "next/navigation";

export default function AdminRootPage() {
  // Cuando alguien vaya a /admin, lo redirigimos al dashboard principal
  redirect("/admin/dashboard");
}
