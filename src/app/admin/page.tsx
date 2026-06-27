import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin-auth";
import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata = {
  title: "Admin — English Journal",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email || !isAdminEmail(user.email)) {
    redirect("/");
  }

  return <AdminDashboard />;
}
