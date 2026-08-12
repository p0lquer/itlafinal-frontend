const NAME_REGEX = /^[\p{L}][\p{L}\p{M}'’.-]*(?: [\p{L}][\p{L}\p{M}'’.-]*)*$/u;
const EMAIL_REGEX = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

export function normalizeSingleLine(value: string) {
  return Array.from(value)
    .filter((character) => {
      const code = character.codePointAt(0) ?? 0;
      return code > 31 && code !== 127;
    })
    .join("")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeEmail(value: string) {
  return normalizeSingleLine(value).toLocaleLowerCase();
}

export function normalizePhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

export function normalizeNotes(value: string) {
  return Array.from(value.replace(/\r\n?/g, "\n"))
    .filter((character) => {
      const code = character.codePointAt(0) ?? 0;
      return code === 10 || (code > 31 && code !== 127);
    })
    .join("")
    .trim();
}

export function validateName(value: string) {
  const normalized = normalizeSingleLine(value);
  if (Array.from(normalized).length < 2 || Array.from(normalized).length > 80 || !NAME_REGEX.test(normalized)) {
    return "El nombre debe tener entre 2 y 80 caracteres y solo usar letras, espacios, apóstrofes, puntos o guiones.";
  }
  return null;
}

export function validateEmail(value: string) {
  const normalized = normalizeEmail(value);
  if (normalized.length > 254 || !EMAIL_REGEX.test(normalized)) return "Escribe un correo electrónico válido.";
  return null;
}

export function validatePhone(value: string, required = true) {
  const normalized = normalizePhone(value);
  if (!normalized && !required) return null;
  if (!/^\+?\d{7,15}$/.test(normalized)) return "El teléfono debe tener entre 7 y 15 dígitos.";
  return null;
}

export function validateNewPassword(value: string) {
  if (value.length < 8 || value.length > 72) return "La contraseña debe tener entre 8 y 72 caracteres.";
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    return "La contraseña debe incluir una mayúscula, una minúscula y un número.";
  }
  return null;
}

export function validateOrder(service: string, weight: number, pieces: number, notes: string) {
  if (!normalizeSingleLine(service)) return "Selecciona un tipo de servicio.";
  if (!Number.isFinite(weight) || weight < 0.1 || weight > 100) return "El peso debe estar entre 0.1 y 100 libras.";
  if (!Number.isInteger(pieces) || pieces < 1 || pieces > 200) return "La orden debe tener entre 1 y 200 piezas.";
  if (Array.from(normalizeNotes(notes)).length > 500) return "Las notas no pueden superar 500 caracteres.";
  return null;
}
