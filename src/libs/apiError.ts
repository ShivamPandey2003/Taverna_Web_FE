
const STATUS_MESSAGES: Record<number, string> = {
  400: "Invalid request. Please check the details and try again.",
  401: "Your session has expired. Please log in again.",
  403: "You don't have permission to perform this action.",
  404: "We couldn't find what you were looking for.",
  409: "This action conflicts with the current state. Please refresh and try again.",
  422: "Some of the information provided is invalid. Please review and try again.",
  500: "Something went wrong on our end. Please try again shortly.",
};

const GENERIC_MESSAGE = "Something went wrong. Please try again.";
const NETWORK_MESSAGE =
  "Network error. Please check your connection and try again.";

function isUsableBackendMessage(message?: string | null): message is string {
  if (!message) return false;
  const trimmed = message.trim();
  if (!trimmed) return false;
  return !/^(error|success|failed|internal server error)$/i.test(trimmed);
}

export function getApiErrorMessage(
  code?: number,
  backendMessage?: string | null,
): string {
  if (isUsableBackendMessage(backendMessage)) return backendMessage;
  if (code && STATUS_MESSAGES[code]) return STATUS_MESSAGES[code];
  if (code && code >= 500) return STATUS_MESSAGES[500];
  if (code && code >= 400) return STATUS_MESSAGES[400];
  return GENERIC_MESSAGE;
}

export function getNetworkErrorMessage(): string {
  return NETWORK_MESSAGE;
}
