import type { MailMessage } from "./email.js";

const BRAND_NAME = "Правко.";

const ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  member: "Участник",
  viewer: "Наблюдатель",
};

export function buildTeamInviteEmail(opts: {
  to: string;
  teamName: string;
  invitedByName: string;
  role: string;
  inviteUrl: string;
}): MailMessage {
  const roleLabel = ROLE_LABELS[opts.role] || opts.role;

  const html = `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0f0e8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0e8;padding:40px 0">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:2px solid #1a1a1a">
      <tr>
        <td style="padding:32px 32px 0;border-bottom:2px solid #1a1a1a">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:900;color:#1a1a1a;letter-spacing:-0.5px">
            ${BRAND_NAME}
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:32px">
          <p style="margin:0 0 20px;font-size:16px;color:#1a1a1a;line-height:1.5">
            <strong>${escapeHtml(opts.invitedByName)}</strong> приглашает вас в команду
            <strong>${escapeHtml(opts.teamName)}</strong> с ролью <strong>${escapeHtml(roleLabel)}</strong>.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px">
            <tr><td style="background:#2d5a2d;padding:14px 32px">
              <a href="${escapeHtml(opts.inviteUrl)}"
                 style="color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;display:inline-block">
                Принять приглашение
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:13px;color:#888;line-height:1.5">
            Или перейдите по ссылке:
          </p>
          <p style="margin:0 0 24px;font-size:13px;color:#2d5a2d;word-break:break-all;line-height:1.5">
            ${escapeHtml(opts.inviteUrl)}
          </p>
          <p style="margin:0;font-size:13px;color:#888;line-height:1.5">
            Приглашение действительно 7 дней.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = `${opts.invitedByName} приглашает вас в команду «${opts.teamName}» с ролью «${roleLabel}».

Принять приглашение: ${opts.inviteUrl}

Приглашение действительно 7 дней.`;

  return {
    to: opts.to,
    subject: `Приглашение в команду «${opts.teamName}» — ${BRAND_NAME}`,
    html,
    text,
  };
}

const TYPE_LABELS: Record<string, string> = {
  bug: "Баг",
  feedback: "Обратная связь",
};

export function buildFeedbackEmail(opts: {
  userName: string;
  userEmail: string;
  type: string;
  message: string;
  to: string;
}): MailMessage {
  const typeLabel = TYPE_LABELS[opts.type] || opts.type;

  const html = `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0f0e8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0e8;padding:40px 0">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:2px solid #1a1a1a">
      <tr>
        <td style="padding:32px 32px 0;border-bottom:2px solid #1a1a1a">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:900;color:#1a1a1a;letter-spacing:-0.5px">
            ${BRAND_NAME} — ${escapeHtml(typeLabel)}
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:32px">
          <p style="margin:0 0 12px;font-size:14px;color:#888;line-height:1.5">
            <strong>От:</strong> ${escapeHtml(opts.userName)} &lt;${escapeHtml(opts.userEmail)}&gt;
          </p>
          <p style="margin:0 0 8px;font-size:14px;color:#888;line-height:1.5">
            <strong>Тип:</strong> ${escapeHtml(typeLabel)}
          </p>
          <div style="margin:20px 0 0;padding:16px;background:#f0f0e8;border:2px solid #1a1a1a;font-size:15px;color:#1a1a1a;line-height:1.6;white-space:pre-wrap">${escapeHtml(opts.message)}</div>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = `${typeLabel} от ${opts.userName} <${opts.userEmail}>

${opts.message}`;

  return {
    to: opts.to,
    subject: `[${typeLabel}] от ${opts.userName} — ${BRAND_NAME}`,
    html,
    text,
  };
}

export function buildUpgradeRequestEmail(opts: {
  userName: string;
  userEmail: string;
  teamName: string;
  currentPlan: string;
  message: string;
  to: string;
}): MailMessage {
  const html = `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0f0e8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0e8;padding:40px 0">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:2px solid #1a1a1a">
      <tr>
        <td style="padding:32px 32px 0;border-bottom:2px solid #1a1a1a">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:900;color:#1a1a1a;letter-spacing:-0.5px">
            ${BRAND_NAME} — Увеличение тарифа
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:32px">
          <p style="margin:0 0 12px;font-size:14px;color:#888;line-height:1.5">
            <strong>От:</strong> ${escapeHtml(opts.userName)} &lt;${escapeHtml(opts.userEmail)}&gt;
          </p>
          <p style="margin:0 0 8px;font-size:14px;color:#888;line-height:1.5">
            <strong>Команда:</strong> ${escapeHtml(opts.teamName)}
          </p>
          <p style="margin:0 0 8px;font-size:14px;color:#888;line-height:1.5">
            <strong>Текущий тариф:</strong> ${escapeHtml(opts.currentPlan)}
          </p>
          <div style="margin:20px 0 0;padding:16px;background:#f0f0e8;border:2px solid #1a1a1a;font-size:15px;color:#1a1a1a;line-height:1.6;white-space:pre-wrap">${escapeHtml(opts.message)}</div>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = `Увеличение тарифа от ${opts.userName} <${opts.userEmail}>
Команда: ${opts.teamName}
Текущий тариф: ${opts.currentPlan}

${opts.message}`;

  return {
    to: opts.to,
    subject: `[Увеличение тарифа] команда «${opts.teamName}» — ${BRAND_NAME}`,
    html,
    text,
  };
}

export function buildSubscriptionCanceledEmail(opts: {
  to: string;
  teamName: string;
  currentPeriodEnd: Date;
  cleanupAfter: Date;
}): MailMessage {
  const periodEndStr = opts.currentPeriodEnd.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  const cleanupStr = opts.cleanupAfter.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

  const html = `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0f0e8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0e8;padding:40px 0">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:2px solid #1a1a1a">
      <tr>
        <td style="padding:32px 32px 0;border-bottom:2px solid #1a1a1a">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:900;color:#1a1a1a;letter-spacing:-0.5px">
            ${BRAND_NAME} — Подписка отменена
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:32px">
          <p style="margin:0 0 20px;font-size:16px;color:#1a1a1a;line-height:1.5">
            Подписка команды <strong>${escapeHtml(opts.teamName)}</strong> была отменена.
          </p>
          <p style="margin:0 0 12px;font-size:15px;color:#1a1a1a;line-height:1.5">
            Доступ к платным функциям сохранится до <strong>${escapeHtml(periodEndStr)}</strong>.
          </p>
          <p style="margin:0 0 12px;font-size:15px;color:#1a1a1a;line-height:1.5">
            После этого комментирование, скачивание и другие действия будут заблокированы.
          </p>
          <div style="margin:20px 0;padding:16px;background:#fef3c7;border:2px solid #f59e0b">
            <p style="margin:0;font-size:14px;color:#92400e;line-height:1.5">
              <strong>Важно:</strong> видеозаписи будут удалены <strong>${escapeHtml(cleanupStr)}</strong>,
              если подписка не будет возобновлена. Комментарии будут сохранены и восстановлены при повторной загрузке видео.
            </p>
          </div>
          <p style="margin:0;font-size:14px;color:#888;line-height:1.5">
            Чтобы сохранить видео, возобновите подписку в настройках команды.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = `Подписка команды «${opts.teamName}» была отменена.

Доступ к платным функциям сохранится до ${periodEndStr}.
После этого комментирование, скачивание и другие действия будут заблокированы.

Важно: видеозаписи будут удалены ${cleanupStr}, если подписка не будет возобновлена.
Комментарии будут сохранены и восстановлены при повторной загрузке видео.

Чтобы сохранить видео, возобновите подписку в настройках команды.`;

  return {
    to: opts.to,
    subject: `Подписка отменена — команда «${opts.teamName}» — ${BRAND_NAME}`,
    html,
    text,
  };
}

export function buildRetentionWarningEmail(opts: {
  to: string;
  teamName: string;
  cleanupAfter: Date;
  videoCount: number;
}): MailMessage {
  const cleanupStr = opts.cleanupAfter.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

  const html = `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0f0e8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0e8;padding:40px 0">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:2px solid #1a1a1a">
      <tr>
        <td style="padding:32px 32px 0;border-bottom:2px solid #1a1a1a">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:900;color:#dc2626;letter-spacing:-0.5px">
            ${BRAND_NAME} — Видео будут удалены
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:32px">
          <div style="margin:0 0 20px;padding:16px;background:#fef2f2;border:2px solid #dc2626">
            <p style="margin:0;font-size:15px;color:#991b1b;line-height:1.5">
              <strong>${opts.videoCount}</strong> ${pluralizeVideos(opts.videoCount)} команды
              <strong>${escapeHtml(opts.teamName)}</strong> будут безвозвратно удалены
              <strong>${escapeHtml(cleanupStr)}</strong>.
            </p>
          </div>
          <p style="margin:0 0 20px;font-size:15px;color:#1a1a1a;line-height:1.5">
            Подписка команды неактивна. Если не возобновить подписку до указанной даты,
            все видеофайлы будут удалены из хранилища.
          </p>
          <p style="margin:0 0 12px;font-size:14px;color:#888;line-height:1.5">
            Комментарии будут сохранены и могут быть восстановлены при повторной загрузке видео.
          </p>
          <p style="margin:0;font-size:14px;color:#888;line-height:1.5">
            Чтобы сохранить видео, возобновите подписку в настройках команды.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = `${opts.videoCount} ${pluralizeVideos(opts.videoCount)} команды «${opts.teamName}» будут безвозвратно удалены ${cleanupStr}.

Подписка команды неактивна. Если не возобновить подписку до указанной даты, все видеофайлы будут удалены из хранилища.

Комментарии будут сохранены и могут быть восстановлены при повторной загрузке видео.

Чтобы сохранить видео, возобновите подписку в настройках команды.`;

  return {
    to: opts.to,
    subject: `⚠ Видео будут удалены ${cleanupStr} — команда «${opts.teamName}» — ${BRAND_NAME}`,
    html,
    text,
  };
}

export function buildVideosCleanedEmail(opts: {
  to: string;
  teamName: string;
  videoCount: number;
}): MailMessage {
  const html = `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0f0e8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0e8;padding:40px 0">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:2px solid #1a1a1a">
      <tr>
        <td style="padding:32px 32px 0;border-bottom:2px solid #1a1a1a">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:900;color:#dc2626;letter-spacing:-0.5px">
            ${BRAND_NAME} — Видео удалены
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:32px">
          <p style="margin:0 0 20px;font-size:16px;color:#1a1a1a;line-height:1.5">
            <strong>${opts.videoCount}</strong> ${pluralizeVideos(opts.videoCount)} команды
            <strong>${escapeHtml(opts.teamName)}</strong> были удалены из хранилища
            в связи с неактивной подпиской.
          </p>
          <p style="margin:0 0 12px;font-size:15px;color:#1a1a1a;line-height:1.5">
            Комментарии к видео были сохранены. При повторной загрузке видео комментарии могут быть восстановлены.
          </p>
          <p style="margin:0;font-size:14px;color:#888;line-height:1.5">
            Чтобы продолжить работу, оформите подписку в настройках команды.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = `${opts.videoCount} ${pluralizeVideos(opts.videoCount)} команды «${opts.teamName}» были удалены из хранилища в связи с неактивной подпиской.

Комментарии к видео были сохранены. При повторной загрузке видео комментарии могут быть восстановлены.

Чтобы продолжить работу, оформите подписку в настройках команды.`;

  return {
    to: opts.to,
    subject: `Видео удалены — команда «${opts.teamName}» — ${BRAND_NAME}`,
    html,
    text,
  };
}

function pluralizeVideos(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "видеозапись";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "видеозаписи";
  return "видеозаписей";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
