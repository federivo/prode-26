// 🃏 Easter egg: un usuario con el "poder de bromista" puede cambiarle la foto
// a cualquiera de sus grupos. Identificado por mail.

export const PRANKSTER_EMAIL = "sebastian.fernandez.soke@gmail.com";

export function isPrankster(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === PRANKSTER_EMAIL;
}
