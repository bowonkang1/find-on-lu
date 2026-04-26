function outlookWebComposeUrl(to: string, subject: string, body: string): string {
  const q = new URLSearchParams({
    to,
    subject,
    body,
  });
  return `https://outlook.office.com/mail/deeplink/compose?${q.toString()}`;
}

/** Opens Outlook mobile compose with prefilled fields (works more reliably than OWA deeplinks on phone browsers). */
function outlookMobileAppComposeUrl(to: string, subject: string, body: string): string {
  const q = new URLSearchParams({
    to,
    subject,
    body,
  });
  return `ms-outlook://emails/new?${q.toString()}`;
}

export function openPrefilledEmail(to: string, subject: string, body: string): void {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    // OWA /mail/deeplink/compose often drops users on Inbox on mobile Safari/Chrome; prefer native Outlook.
    window.location.href = outlookMobileAppComposeUrl(to, subject, body);
    return;
  }

  const outlookUrl = outlookWebComposeUrl(to, subject, body);
  const openedWindow = window.open(outlookUrl, "_blank", "noopener,noreferrer");
  if (!openedWindow) {
    window.location.assign(outlookUrl);
  }
}
