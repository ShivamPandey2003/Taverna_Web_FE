// US numbers only: the form shows "+1" before the field and the API gets "+1" + 10 digits
export const US_PHONE_PREFIX = "+1";

// The 10-digit number; a pasted or autofilled "+1 …" loses its country code
export function phoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");

  return (
    digits.length > 10 && digits.startsWith("1")
      ? digits.slice(1)
      : digits
  ).slice(0, 10);
}

// "2345678910" → "(234) 567 8910", built up as the digits are typed
export function formatUsPhone(value: string) {
  const digits = phoneDigits(value);

  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6)
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export const toApiPhone = (value: string) =>
  `${US_PHONE_PREFIX}${phoneDigits(value)}`;
