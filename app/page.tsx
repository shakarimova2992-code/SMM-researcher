import Link from "next/link";
import { Badge, Card, Container, GhostButton, Logo, PrimaryButton, SectionTitle } from "@/components/ui";

const STEPS = [
  {
    n: "01",
    title: "Находим топ-аккаунты ниши",
    desc: "Вводите нишу и город — получаете рейтинг самых многочисленных и активных аккаунтов в этой локации.",
    emoji: "🔎",
  },
  {
    n: "02",
    title: "Разбираем топ-10 постов и Reels",
    desc: "Выбираете аккаунт — видите его 10 самых сильных публикаций и 10 самых сильных Reels с метриками.",
    emoji: "📊",
  },
  {
    n: "03",
    title: "Получаете подробный отчёт",
    desc: "Вовлечённость, лучшее время публикаций, форматы, паттерны хуков — всё, что зашло у лидеров ниши.",
    emoji: "🧠",
  },
  {
    n: "04",
    title: "10 тем под вашу нишу",
    desc: "Алгоритм адаптирует залетевшие форматы под вашу тематику — 10 готовых идей для постов и Reels.",
    emoji: "💡",
  },
];

const AUDIENCE = [
  {
    title: "SMM-специалистам",
    desc: "Не тратите часы на ручной разбор конкурентов — экспресс-диагностика ниши за пару минут.",
    emoji: "🧑‍💻",
  },
  {
    title: "Креаторам",
    desc: "Сразу видите трендовые темы под свою нишу, не гадая, что снимать на этой неделе.",
    emoji: "🎬",
  },
  {
    title: "Владельцам бизнеса",
    desc: "Понимаете, что реально работает у лидеров рынка, и получаете чек-лист с решениями.",
    emoji: "🏢",
  },
];

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-500/30 blur-[110px] animate-float" />
      <div className="pointer-events-none absolute -right-24 top-40 h-96 w-96 rounded-full bg-flame-500/25 blur-[110px] animate-float" style={{ animationDelay: "1.5s" }} />
      <div className="pointer-events-none absolute left-1/3 top-[60%] h-80 w-80 rounded-full bg-gold-500/20 blur-[120px] animate-float" style={{ animationDelay: "3s" }} />

      <header className="relative z-10">
        <Container className="flex items-center justify-between py-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-semibold text-white/70 sm:flex">
            <a href="#how" className="hover:text-white">Как это работает</a>
            <a href="#audience" className="hover:text-white">Для кого</a>
            <a href="#preview" className="hover:text-white">Пример отчёта</a>
          </nav>
          <Link href="/login">
            <GhostButton className="px-5 py-2.5 text-sm">Войти</GhostButton>
          </Link>
        </Container>
      </header>

      <section className="relative z-10">
        <Container className="flex flex-col items-center pb-20 pt-10 text-center sm:pt-16">
          <Badge tone="gold">🚀 Экспресс-диагностика Instagram-ниши</Badge>
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] sm:text-6xl">
            Найдите тренды ниши<br />и <span className="text-gradient">залетающие темы</span> за пару минут
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/65">
            NicheScope находит топ-аккаунты по нише и городу, разбирает их лучшие посты и Reels
            и выдаёт готовый чек-лист с идеями — как презентацию для клиента или для себя.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link href="/login">
              <PrimaryButton className="px-8 py-4 text-base">Начать бесплатно →</PrimaryButton>
            </Link>
            <a href="#how">
              <GhostButton className="px-8 py-4 text-base">Как это работает</GhostButton>
            </a>
          </div>
          <p className="mt-4 text-xs text-white/40">Вход по email-ссылке · без пароля · 1 аккаунт на ссылку</p>

          <div className="mt-16 grid w-full max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["12 мин", "среднее время диагностики"],
              ["10+10", "постов и Reels в разборе"],
              ["10", "готовых тем под нишу"],
              ["1 клик", "экспорт в презентацию"],
            ].map(([big, small]) => (
              <Card key={small} className="p-5 text-center">
                <div className="font-display text-2xl font-extrabold text-gradient">{big}</div>
                <div className="mt-1 text-xs text-white/55">{small}</div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section id="how" className="relative z-10 border-t border-white/5 bg-white/[0.02] py-24">
        <Container>
          <SectionTitle eyebrow="Как это работает" title="Четыре шага от ниши до готового плана контента" className="mx-auto text-center [&>p]:mx-auto" />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <Card key={s.n} className="relative">
                <span className="font-display text-4xl">{s.emoji}</span>
                <div className="mt-4 font-display text-xs font-bold tracking-widest text-white/35">{s.n}</div>
                <h3 className="mt-2 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-white/60">{s.desc}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section id="audience" className="relative z-10 py-24">
        <Container>
          <SectionTitle eyebrow="Для кого" title="Экономит время всем, кто работает с контентом" className="mx-auto text-center [&>p]:mx-auto" />
          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {AUDIENCE.map((a) => (
              <Card key={a.title} className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient-soft text-2xl">{a.emoji}</div>
                <h3 className="mt-4 font-display text-lg font-bold">{a.title}</h3>
                <p className="mt-2 text-sm text-white/60">{a.desc}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section id="preview" className="relative z-10 border-t border-white/5 bg-white/[0.02] py-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionTitle
                eyebrow="Результат"
                title="На выходе — рабочий чек-лист в формате презентации"
                subtitle="Проблемные моменты, идеи решения и топ-10 тем — в одном слайд-отчёте, который можно скачать в PDF и показать клиенту."
              />
              <ul className="mt-6 space-y-3 text-sm text-white/70">
                {["Диагностика проблем аккаунта с приоритетом", "Готовые формулировки решений", "10 адаптированных под нишу тем", "Экспорт одним кликом"].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint-500/20 text-mint-400">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="mt-8 inline-block">
                <PrimaryButton className="px-7 py-3.5">Попробовать на своей нише</PrimaryButton>
              </Link>
            </div>
            <Card className="bg-brand-gradient-soft">
              <div className="flex items-center justify-between">
                <Badge tone="flame">🔥 Слайд 4 из 6</Badge>
                <span className="text-xs text-white/40">nichescope.app/presentation</span>
              </div>
              <h4 className="mt-5 font-display text-xl font-bold">Топ-3 проблемы аккаунта</h4>
              <div className="mt-4 space-y-3">
                {[
                  ["Критично", "Нестабильная частота Reels", "flame"],
                  ["Важно", "Слабый CTA в описаниях", "gold"],
                  ["Возможность", "Не используется формат «до/после»", "mint"],
                ].map(([tag, text, tone]) => (
                  <div key={text} className="flex items-center gap-3 rounded-xl bg-black/20 p-3">
                    <Badge tone={tone as any} className="shrink-0">{tag}</Badge>
                    <span className="text-sm text-white/80">{text}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Container>
      </section>

      <section className="relative z-10 py-24">
        <Container>
          <Card className="flex flex-col items-center bg-brand-gradient-soft p-12 text-center">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Готовы посмотреть на свою нишу трезвым взглядом?</h2>
            <p className="mt-3 max-w-lg text-white/65">Вход по email — без пароля. Одна ссылка = один Instagram-аккаунт для анализа.</p>
            <Link href="/login" className="mt-7">
              <PrimaryButton className="px-9 py-4 text-base">Начать бесплатно →</PrimaryButton>
            </Link>
          </Card>
        </Container>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-10">
        <Container className="flex flex-col items-center justify-between gap-4 text-sm text-white/40 sm:flex-row">
          <Logo className="text-white/70" />
          <span>© {new Date().getFullYear()} NicheScope · экспресс-аналитика Instagram</span>
        </Container>
      </footer>
    </main>
  );
}
