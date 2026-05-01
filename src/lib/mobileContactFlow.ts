interface MobileContactPromptParams {
  to: string;
  subject: string;
  message: string;
}

export type MobileContactAction = "send" | "cancel";

export function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function getMobileContactAction({
  to,
  subject,
  message,
}: MobileContactPromptParams): MobileContactAction {
  const preview =
    message.length > 220 ? `${message.slice(0, 220)}...` : message;

  const sendDirectly = window.confirm(
    `Send this message now?\n\nTo: ${to}\nSubject: ${subject}\n\nMessage preview:\n${preview}\n\nTap OK to send.\nTap Cancel to close without sending.`
  );

  return sendDirectly ? "send" : "cancel";
}
