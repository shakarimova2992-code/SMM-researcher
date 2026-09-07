"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, Container, Logo, PrimaryButton } from "@/components/ui";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const error = params.get("error");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    setDevLink(null);
    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? "Не удалось отправить ссылку");
        return;
      }
      setStatus("sent");
      setMessage(data.message);
      if (data.devMode && data.link) setDevLink(data.link);
    } catch {
      setStatus("error");
      setMessage("Ошибка сети, попробуйте ещё раз");
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-violet-500/30 blur-[110px]" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-flame-500/25 blur-[110px]" />

      <Container className="relative z-10 flex max-w-md flex-col items-center">
        <Logo className="mb-8" />
        <Card className="w-full">
          <h1 className="font-display text-2xl font-extrabold">Вход в NicheScope</h1>
          <p className="mt-2 text-sm text-white/60">
            Без пароля: пришлём одноразовую ссылку на почту. По этой ссылке будет доступен анализ одного
            Instagram-аккаунта.
          </p>

          {error === "expired" && (
            <p className="mt-4 rounded-lg border border-flame-500/30 bg-flame-500/10 p-3 text-sm text-flame-400">
              Ссылка устарела или уже использована. Запросите новую.
            </p>
          )}

          {status !== "sent" ? (
            <form onSubmit={submit} className="mt-6 space-y-3">
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm outline-none placeholder:text-white/30 focus:border-violet-400"
              />
              <PrimaryButton type="submit" disabled={status === "loading"} className="w-full">
                {status === "loading" ? "Отправляем…" : "Получить ссылку для входа"}
              </PrimaryButton>
              {status === "error" && <p className="text-center text-sm text-flame-400">{message}</p>}
            </form>
          ) : (
            <div className="mt-6 space-y-3">
              <p className="rounded-lg border border-mint-400/30 bg-mint-500/10 p-3 text-sm text-mint-400">{message}</p>
              {devLink && (
                <a
                  href={devLink}
                  className="block break-all rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-violet-200 underline"
                >
                  {devLink}
                </a>
              )}
              <button
                onClick={() => setStatus("idle")}
                className="w-full text-center text-xs text-white/40 hover:text-white/70"
              >
                Отправить на другой email
              </button>
            </div>
          )}
        </Card>
        <Link href="/" className="mt-6 text-sm text-white/40 hover:text-white/70">
          ← На главную
        </Link>
      </Container>
    </main>
  );
}
