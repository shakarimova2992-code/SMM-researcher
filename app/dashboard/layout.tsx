import { redirect } from "next/navigation";
import { getSessionEmail } from "@/lib/session";
import { getUser } from "@/lib/db";
import { isUnlimitedEmail } from "@/lib/config";
import DashboardNav from "@/components/DashboardNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const email = await getSessionEmail();
  if (!email) redirect("/login");
  const user = await getUser(email);

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-20" />
      <div className="pointer-events-none fixed -left-32 -top-32 h-96 w-96 rounded-full bg-violet-500/20 blur-[120px]" />
      <DashboardNav email={email} boundAccount={user?.boundAccount ?? null} unlimited={isUnlimitedEmail(email)} />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24 pt-8 sm:px-8">{children}</main>
    </div>
  );
}
