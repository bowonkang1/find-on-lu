export function openPrefilledEmail(to: string, subject: string, body: string): void {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  const encodedTo = encodeURIComponent(to);

  const outlookUrl = `https://outlook.office365.com/mail/deeplink/compose?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Keep behavior consistent: always use Outlook prefilled compose.
  // On mobile, direct navigation is more reliable than popup windows.
  if (isMobile) {
    window.location.href = outlookUrl;
    return;
  }

  const openedWindow = window.open(outlookUrl, "_blank", "noopener,noreferrer");
  if (!openedWindow) {
    window.location.href = outlookUrl;
  }
}
