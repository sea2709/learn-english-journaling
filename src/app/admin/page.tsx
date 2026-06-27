import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/AdminDashboard";
import { getCurrentAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/");
  }

  return <AdminDashboard adminEmail={admin.email ?? "Admin"} />;
}
