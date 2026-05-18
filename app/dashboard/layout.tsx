import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavBar from "@/components/navbar";
import { getPermessiUtente } from "@/lib/permessi";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const permessi = await getPermessiUtente();

  return (
    <div className="min-h-screen bg-background">
      <NavBar userEmail={user.email ?? ""} permessi={permessi} />
      <main className="sm:pl-56 pt-12 sm:pt-0 pb-20 sm:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
