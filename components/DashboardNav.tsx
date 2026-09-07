"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, Container, GhostButton, Logo } from "@/components/ui";

export default function DashboardNav({
  email,
  boundAccount,
}: {
  email: string;
  boundAccount: string | null;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="relative z-10 border-b border-white/5">
      <Container className="flex flex-wrap items-center justify-between gap-3 py-5">
        <Logo />
        <div className="flex items-center gap-3">
          {boundAccount && (
            <Link href={`/dashboard/account/${boundAccount}`}>
              <Badge tone="mint" className="cursor-pointer">🔒 @{boundAccount}</Badge>
            </Link>
          )}
          <span className="hidden text-sm text-white/50 sm:inline">{email}</span>
          <GhostButton onClick={logout} className="px-4 py-2 text-xs">
            Выйти
          </GhostButton>
        </div>
      </Container>
    </header>
  );
}
