// País → código de bandera (ISO 3166-1 alfa-2, en minúscula) a partir del
// nombre que devuelve football-data.org. Lo usamos para servir banderas como
// imagen (ver components/flag.tsx): el emoji de bandera NO se renderiza en
// Windows ni en varios navegadores, así que las imágenes son más confiables.
// Si no conocemos el país, devolvemos null y la UI muestra un fallback.

const ISO2: Record<string, string> = {
  argentina: "ar", australia: "au", austria: "at", belgium: "be",
  bolivia: "bo", brazil: "br", cameroon: "cm", canada: "ca", chile: "cl",
  colombia: "co", "costa rica": "cr", croatia: "hr", czechia: "cz",
  "czech republic": "cz", denmark: "dk", ecuador: "ec", egypt: "eg",
  france: "fr", germany: "de", ghana: "gh", greece: "gr", iran: "ir",
  "ir iran": "ir", iraq: "iq", italy: "it", "ivory coast": "ci",
  "cote d'ivoire": "ci", "côte d'ivoire": "ci", jamaica: "jm", japan: "jp",
  jordan: "jo", mexico: "mx", morocco: "ma", netherlands: "nl",
  "new zealand": "nz", nigeria: "ng", norway: "no", panama: "pa",
  paraguay: "py", peru: "pe", poland: "pl", portugal: "pt", qatar: "qa",
  "saudi arabia": "sa", senegal: "sn", serbia: "rs", slovakia: "sk",
  slovenia: "si", "south africa": "za", "south korea": "kr",
  "korea republic": "kr", spain: "es", sweden: "se", switzerland: "ch",
  tunisia: "tn", turkey: "tr", "türkiye": "tr", turkiye: "tr",
  ukraine: "ua", "united states": "us", usa: "us", uruguay: "uy",
  venezuela: "ve", algeria: "dz", "cape verde": "cv", "cape verde islands": "cv",
  "cabo verde": "cv", "new caledonia": "nc", "el salvador": "sv",
  honduras: "hn", guatemala: "gt", "trinidad and tobago": "tt",
  curacao: "cw", "curaçao": "cw", haiti: "ht", suriname: "sr",
  uzbekistan: "uz", "united arab emirates": "ae", oman: "om", bahrain: "bh",
  "north macedonia": "mk", "bosnia and herzegovina": "ba",
  "bosnia-herzegovina": "ba", romania: "ro", "republic of ireland": "ie",
  ireland: "ie", iceland: "is", finland: "fi", angola: "ao",
  "burkina faso": "bf", mali: "ml", "south sudan": "ss", mozambique: "mz",
  gabon: "ga", benin: "bj", namibia: "na", madagascar: "mg", tanzania: "tz",
  kenya: "ke", "dr congo": "cd", "congo dr": "cd",
  "democratic republic of congo": "cd", libya: "ly", togo: "tg",
  zambia: "zm", guinea: "gn", gambia: "gm",
};

// Subdivisiones del Reino Unido (flagcdn las sirve con estos códigos).
const SUBDIV: Record<string, string> = {
  england: "gb-eng",
  scotland: "gb-sct",
  wales: "gb-wls",
  "northern ireland": "gb-nir",
};

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Código de bandera para usar en una URL de flagcdn (ej: "ar", "gb-eng").
 * Devuelve null si no conocemos el país.
 */
export function flagCode(name: string | null | undefined): string | null {
  if (!name) return null;
  const key = normalize(name);
  return SUBDIV[key] ?? ISO2[key] ?? null;
}
