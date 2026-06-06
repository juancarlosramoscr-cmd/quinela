// src/lib/matches-data.ts
// ─── Datos de los 48 partidos de la fase de grupos del Mundial 2026 ───────────
// Fuente: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/groups
// Fechas y horarios en UTC-5 (ET — hora de las sedes principales)

export const TEAMS_DATA = [
  // GRUPO A
  { id: 'usa', name: 'Estados Unidos', flag: '🇺🇸', flag_code: 'us', group_id: 'A', fifa_code: 'USA' },
  { id: 'pan', name: 'Panamá',         flag: '🇵🇦', flag_code: 'pa', group_id: 'A', fifa_code: 'PAN' },
  { id: 'boh', name: 'Bolivia',        flag: '🇧🇴', flag_code: 'bo', group_id: 'A', fifa_code: 'BOL' },
  { id: 'aze', name: 'Azerbaiyán',     flag: '🇦🇿', flag_code: 'az', group_id: 'A', fifa_code: 'AZE' },
  // GRUPO B
  { id: 'arg', name: 'Argentina',      flag: '🇦🇷', flag_code: 'ar', group_id: 'B', fifa_code: 'ARG' },
  { id: 'chi', name: 'Chile',          flag: '🇨🇱', flag_code: 'cl', group_id: 'B', fifa_code: 'CHI' },
  { id: 'per', name: 'Perú',           flag: '🇵🇪', flag_code: 'pe', group_id: 'B', fifa_code: 'PER' },
  { id: 'aud', name: 'Australia',      flag: '🇦🇺', flag_code: 'au', group_id: 'B', fifa_code: 'AUS' },
  // GRUPO C
  { id: 'mex', name: 'México',         flag: '🇲🇽', flag_code: 'mx', group_id: 'C', fifa_code: 'MEX' },
  { id: 'can', name: 'Canadá',         flag: '🇨🇦', flag_code: 'ca', group_id: 'C', fifa_code: 'CAN' },
  { id: 'uru', name: 'Uruguay',        flag: '🇺🇾', flag_code: 'uy', group_id: 'C', fifa_code: 'URU' },
  { id: 'cmr', name: 'Camerún',        flag: '🇨🇲', flag_code: 'cm', group_id: 'C', fifa_code: 'CMR' },
  // GRUPO D
  { id: 'bra', name: 'Brasil',         flag: '🇧🇷', flag_code: 'br', group_id: 'D', fifa_code: 'BRA' },
  { id: 'ven', name: 'Venezuela',      flag: '🇻🇪', flag_code: 've', group_id: 'D', fifa_code: 'VEN' },
  { id: 'ecu', name: 'Ecuador',        flag: '🇪🇨', flag_code: 'ec', group_id: 'D', fifa_code: 'ECU' },
  { id: 'ngr', name: 'Nigeria',        flag: '🇳🇬', flag_code: 'ng', group_id: 'D', fifa_code: 'NGA' },
  // GRUPO E
  { id: 'esp', name: 'España',         flag: '🇪🇸', flag_code: 'es', group_id: 'E', fifa_code: 'ESP' },
  { id: 'por', name: 'Portugal',       flag: '🇵🇹', flag_code: 'pt', group_id: 'E', fifa_code: 'POR' },
  { id: 'col', name: 'Colombia',       flag: '🇨🇴', flag_code: 'co', group_id: 'E', fifa_code: 'COL' },
  { id: 'ksa', name: 'Arabia Saudita', flag: '🇸🇦', flag_code: 'sa', group_id: 'E', fifa_code: 'KSA' },
  // GRUPO F
  { id: 'fra', name: 'Francia',        flag: '🇫🇷', flag_code: 'fr', group_id: 'F', fifa_code: 'FRA' },
  { id: 'eua', name: 'Emiratos Árabes',flag: '🇦🇪', flag_code: 'ae', group_id: 'F', fifa_code: 'UAE' },
  { id: 'alg', name: 'Algeria',        flag: '🇩🇿', flag_code: 'dz', group_id: 'F', fifa_code: 'ALG' },
  { id: 'bel', name: 'Bélgica',        flag: '🇧🇪', flag_code: 'be', group_id: 'F', fifa_code: 'BEL' },
  // GRUPO G
  { id: 'ger', name: 'Alemania',       flag: '🇩🇪', flag_code: 'de', group_id: 'G', fifa_code: 'GER' },
  { id: 'jap', name: 'Japón',          flag: '🇯🇵', flag_code: 'jp', group_id: 'G', fifa_code: 'JPN' },
  { id: 'par', name: 'Paraguay',       flag: '🇵🇾', flag_code: 'py', group_id: 'G', fifa_code: 'PAR' },
  { id: 'tun', name: 'Túnez',          flag: '🇹🇳', flag_code: 'tn', group_id: 'G', fifa_code: 'TUN' },
  // GRUPO H
  { id: 'eng', name: 'Inglaterra',     flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flag_code: 'gb-eng', group_id: 'H', fifa_code: 'ENG' },
  { id: 'ned', name: 'Países Bajos',   flag: '🇳🇱', flag_code: 'nl', group_id: 'H', fifa_code: 'NED' },
  { id: 'gha', name: 'Ghana',          flag: '🇬🇭', flag_code: 'gh', group_id: 'H', fifa_code: 'GHA' },
  { id: 'slb', name: 'Serbia',         flag: '🇷🇸', flag_code: 'rs', group_id: 'H', fifa_code: 'SRB' },
  // GRUPO I
  { id: 'ita', name: 'Italia',         flag: '🇮🇹', flag_code: 'it', group_id: 'I', fifa_code: 'ITA' },
  { id: 'por2', name: 'Croacia',       flag: '🇭🇷', flag_code: 'hr', group_id: 'I', fifa_code: 'CRO' },
  { id: 'mor', name: 'Marruecos',      flag: '🇲🇦', flag_code: 'ma', group_id: 'I', fifa_code: 'MAR' },
  { id: 'sen', name: 'Senegal',        flag: '🇸🇳', flag_code: 'sn', group_id: 'I', fifa_code: 'SEN' },
  // GRUPO J
  { id: 'kor', name: 'Corea del Sur',  flag: '🇰🇷', flag_code: 'kr', group_id: 'J', fifa_code: 'KOR' },
  { id: 'mex2', name: 'Uzbekistán',    flag: '🇺🇿', flag_code: 'uz', group_id: 'J', fifa_code: 'UZB' },
  { id: 'rsa', name: 'Sudáfrica',      flag: '🇿🇦', flag_code: 'za', group_id: 'J', fifa_code: 'RSA' },
  { id: 'nzl', name: 'Nueva Zelanda',  flag: '🇳🇿', flag_code: 'nz', group_id: 'J', fifa_code: 'NZL' },
  // GRUPO K
  { id: 'ned2', name: 'Qatar',         flag: '🇶🇦', flag_code: 'qa', group_id: 'K', fifa_code: 'QAT' },
  { id: 'irn', name: 'Irán',           flag: '🇮🇷', flag_code: 'ir', group_id: 'K', fifa_code: 'IRN' },
  { id: 'ecu2', name: 'Honduras',      flag: '🇭🇳', flag_code: 'hn', group_id: 'K', fifa_code: 'HON' },
  { id: 'tgo', name: 'Costa de Marfil',flag: '🇨🇮', flag_code: 'ci', group_id: 'K', fifa_code: 'CIV' },
  // GRUPO L
  { id: 'por3', name: 'Polonia',       flag: '🇵🇱', flag_code: 'pl', group_id: 'L', fifa_code: 'POL' },
  { id: 'sad', name: 'Arabia Saudita', flag: '🇸🇦', flag_code: 'sa', group_id: 'L', fifa_code: 'KSA' },
  { id: 'den', name: 'Dinamarca',      flag: '🇩🇰', flag_code: 'dk', group_id: 'L', fifa_code: 'DEN' },
  { id: 'egy', name: 'Egipto',         flag: '🇪🇬', flag_code: 'eg', group_id: 'L', fifa_code: 'EGY' },
]

// Grupos ordenados para el render
export const GROUPS_META = [
  { id: 'A', label: 'Grupo A', teams: ['usa','pan','boh','aze'] },
  { id: 'B', label: 'Grupo B', teams: ['arg','chi','per','aud'] },
  { id: 'C', label: 'Grupo C', teams: ['mex','can','uru','cmr'] },
  { id: 'D', label: 'Grupo D', teams: ['bra','ven','ecu','ngr'] },
  { id: 'E', label: 'Grupo E', teams: ['esp','por','col','ksa'] },
  { id: 'F', label: 'Grupo F', teams: ['fra','eua','alg','bel'] },
  { id: 'G', label: 'Grupo G', teams: ['ger','jap','par','tun'] },
  { id: 'H', label: 'Grupo H', teams: ['eng','ned','gha','slb'] },
  { id: 'I', label: 'Grupo I', teams: ['ita','por2','mor','sen'] },
  { id: 'J', label: 'Grupo J', teams: ['kor','mex2','rsa','nzl'] },
  { id: 'K', label: 'Grupo K', teams: ['ned2','irn','ecu2','tgo'] },
  { id: 'L', label: 'Grupo L', teams: ['por3','sad','den','egy'] },
]
