function outlookWebComposeUrl(to: string, subject: string, body: string): string {
  const encodedTo = encodeURIComponent(to);
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `https://outlook.office.com/mail/deeplink/compose?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`;
}

/** Opens Outlook mobile compose with prefilled fields (works more reliably than OWA deeplinks on phone browsers). */
function outlookMobileAppComposeUrl(to: string, subject: string, body: string): string {
  const encodedTo = encodeURIComponent(to);
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `ms-outlook://emails/new?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`;
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
    const leaveSite = window.confirm(
      "Your browser blocked the new tab.\n\n" +
        "OK — open Outlook compose in this tab (you will leave Find On LU).\n" +
        "Cancel — stay on Find On LU."
    );
    if (leaveSite) {
      window.location.assign(outlookUrl);
    }
    return;
  }

  try {
    openedWindow.opener = null;
  } catch {
    /* noop */
  }
}
