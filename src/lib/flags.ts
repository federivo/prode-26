// Bandera (emoji) a partir del nombre del país que devuelve football-data.org.
// Si no lo conocemos, devolvemos "" (sin bandera) sin romper nada.

const ISO2: Record<string, string> = {
  argentina: "AR", australia: "AU", austria: "AT", belgium: "BE",
  bolivia: "BO", brazil: "BR", cameroon: "CM", canada: "CA", chile: "CL",
  colombia: "CO", "costa rica": "CR", croatia: "HR", czechia: "CZ",
  "czech republic": "CZ", denmark: "DK", ecuador: "EC", egypt: "EG",
  france: "FR", germany: "DE", ghana: "GH", greece: "GR", iran: "IR",
  "ir iran": "IR", iraq: "IQ", italy: "IT", "ivory coast": "CI",
  "cote d'ivoire": "CI", "côte d'ivoire": "CI", jamaica: "JM", japan: "JP",
  jordan: "JO", mexico: "MX", morocco: "MA", netherlands: "NL",
  "new zealand": "NZ", nigeria: "NG", norway: "NO", panama: "PA",
  paraguay: "PY", peru: "PE", poland: "PL", portugal: "PT", qatar: "QA",
  "saudi arabia": "SA", senegal: "SN", serbia: "RS", slovakia: "SK",
  slovenia: "SI", "south africa": "ZA", "south korea": "KR",
  "korea republic": "KR", spain: "ES", sweden: "SE", switzerland: "CH",
  tunisia: "TN", turkey: "TR", "türkiye": "TR", turkiye: "TR",
  ukraine: "UA", "united states": "US", usa: "US", uruguay: "UY",
  venezuela: "VE", algeria: "DZ", "cape verde": "CV", "cabo verde": "CV",
  "new caledonia": "NC", "el salvador": "SV", honduras: "HN",
  guatemala: "GT", "trinidad and tobago": "TT", curacao: "CW",
  "curaçao": "CW", haiti: "HT", suriname: "SR", uzbekistan: "UZ",
  "united arab emirates": "AE", oman: "OM", bahrain: "BH",
  "north macedonia": "MK", "bosnia and herzegovina": "BA", romania: "RO",
  "republic of ireland": "IE", ireland: "IE", iceland: "IS", finland: "FI",
  angola: "AO", "burkina faso": "BF", mali: "ML", "south sudan": "SS",
  mozambique: "MZ", gabon: "GA", benin: "BJ", namibia: "NA",
  madagascar: "MG", tanzania: "TZ", kenya: "KE", "dr congo": "CD",
  "democratic republic of congo": "CD", libya: "LY", togo: "TG",
  zambia: "ZM", guinea: "GN", gambia: "GM",
};

// Subdivisiones con emoji propio (Reino Unido).
const SPECIAL: Record<string, string> = {
  england: "🏴\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
  scotland: "🏴\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
  wales: "🏴\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}",
};

function iso2ToEmoji(cc: string): string {
  return cc
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export function flagEmoji(name: string | null | undefined): string {
  if (!name) return "";
  const key = name.trim().toLowerCase();
  if (SPECIAL[key]) return SPECIAL[key];
  const cc = ISO2[key];
  return cc ? iso2ToEmoji(cc) : "";
}
