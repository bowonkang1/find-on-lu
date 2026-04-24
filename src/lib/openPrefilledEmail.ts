export function openPrefilledEmail(to: string, subject: string, body: string): void {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  const encodedTo = encodeURIComponent(to);

  const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`;
  // Use direct navigation for all devices to avoid popup blocking.
  window.location.assign(outlookUrl);
}
