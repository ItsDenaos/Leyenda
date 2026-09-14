// `code`: código ISO 3166-1 alpha-2 (o subdivisión de Reino Unido), usado
// para pedir la imagen real de la bandera — Windows no dibuja los emoji
// de bandera de país, así que `flag` queda solo como respaldo de texto.
// Orden alfabético (localeCompare "es") — no hay ninguna otra lógica que
// dependa del orden de este array, así que reordenarlo es seguro.
export interface Country {
  name: string
  code: string
  flag: string
}

export const COUNTRIES: Country[] = [
  { name: 'Alemania', code: 'de', flag: '🇩🇪' },
  { name: 'Arabia Saudita', code: 'sa', flag: '🇸🇦' },
  { name: 'Argelia', code: 'dz', flag: '🇩🇿' },
  { name: 'Argentina', code: 'ar', flag: '🇦🇷' },
  { name: 'Australia', code: 'au', flag: '🇦🇺' },
  { name: 'Bélgica', code: 'be', flag: '🇧🇪' },
  { name: 'Bolivia', code: 'bo', flag: '🇧🇴' },
  { name: 'Brasil', code: 'br', flag: '🇧🇷' },
  { name: 'Camerún', code: 'cm', flag: '🇨🇲' },
  { name: 'Canadá', code: 'ca', flag: '🇨🇦' },
  { name: 'Catar', code: 'qa', flag: '🇶🇦' },
  { name: 'Chile', code: 'cl', flag: '🇨🇱' },
  { name: 'Colombia', code: 'co', flag: '🇨🇴' },
  { name: 'Corea del Sur', code: 'kr', flag: '🇰🇷' },
  { name: 'Costa Rica', code: 'cr', flag: '🇨🇷' },
  { name: 'Croacia', code: 'hr', flag: '🇭🇷' },
  { name: 'Dinamarca', code: 'dk', flag: '🇩🇰' },
  { name: 'Ecuador', code: 'ec', flag: '🇪🇨' },
  { name: 'Egipto', code: 'eg', flag: '🇪🇬' },
  { name: 'Escocia', code: 'gb-sct', flag: '🏴' },
  { name: 'España', code: 'es', flag: '🇪🇸' },
  { name: 'Estados Unidos', code: 'us', flag: '🇺🇸' },
  { name: 'Francia', code: 'fr', flag: '🇫🇷' },
  { name: 'Gales', code: 'gb-wls', flag: '🏴' },
  { name: 'Ghana', code: 'gh', flag: '🇬🇭' },
  { name: 'Inglaterra', code: 'gb-eng', flag: '🏴' },
  { name: 'Irán', code: 'ir', flag: '🇮🇷' },
  { name: 'Italia', code: 'it', flag: '🇮🇹' },
  { name: 'Jamaica', code: 'jm', flag: '🇯🇲' },
  { name: 'Japón', code: 'jp', flag: '🇯🇵' },
  { name: 'Marruecos', code: 'ma', flag: '🇲🇦' },
  { name: 'México', code: 'mx', flag: '🇲🇽' },
  { name: 'Nigeria', code: 'ng', flag: '🇳🇬' },
  { name: 'Noruega', code: 'no', flag: '🇳🇴' },
  { name: 'Países Bajos', code: 'nl', flag: '🇳🇱' },
  { name: 'Panamá', code: 'pa', flag: '🇵🇦' },
  { name: 'Paraguay', code: 'py', flag: '🇵🇾' },
  { name: 'Perú', code: 'pe', flag: '🇵🇪' },
  { name: 'Polonia', code: 'pl', flag: '🇵🇱' },
  { name: 'Portugal', code: 'pt', flag: '🇵🇹' },
  { name: 'Senegal', code: 'sn', flag: '🇸🇳' },
  { name: 'Serbia', code: 'rs', flag: '🇷🇸' },
  { name: 'Suecia', code: 'se', flag: '🇸🇪' },
  { name: 'Suiza', code: 'ch', flag: '🇨🇭' },
  { name: 'Uruguay', code: 'uy', flag: '🇺🇾' },
  { name: 'Venezuela', code: 've', flag: '🇻🇪' },
]
