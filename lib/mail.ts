// Отправка magic-link писем.
// В прототипе нет подключённого SMTP/провайдера — ссылка возвращается в ответе API
// и показывается прямо в интерфейсе ("dev-режим"), плюс пишется в консоль сервера.
// Чтобы включить реальную отправку: подключите Resend/Postmark/SES и замените тело
// функции на реальный вызов, оставив сигнатуру такой же.

export async function sendMagicLinkEmail(email: string, link: string): Promise<{ devMode: boolean }> {
  const hasRealProvider = Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST);

  if (!hasRealProvider) {
    console.log(`[NicheScope][dev-mail] Magic link for ${email}: ${link}`);
    return { devMode: true };
  }

  // Пример подключения Resend (раскомментируйте и добавьте RESEND_API_KEY в .env):
  //
  // const res = await fetch("https://api.resend.com/emails", {
  //   method: "POST",
  //   headers: {
  //     Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     from: "NicheScope <login@yourdomain.com>",
  //     to: email,
  //     subject: "Ваша ссылка для входа в NicheScope",
  //     html: `<p>Войти: <a href="${link}">${link}</a></p><p>Ссылка действует 15 минут.</p>`,
  //   }),
  // });

  console.log(`[NicheScope][mail] Magic link for ${email}: ${link}`);
  return { devMode: false };
}
