/**
 * Motor de Detección Heurística de Contenido Ofensivo, Spam y Lenguaje Abusivo
 * Diseñado para la moderación del Chat Público de LANDA.
 */

// Diccionario clasificado de términos y patrones ofensivos (Colombia / LatAm)
export const OFFENSIVE_TERMS = [
  // Insultos y groserías de alto calibre
  'gonorrea', 'gonorreas', 'gonorriento',
  'malparido', 'malparida', 'malparidos', 'malparidas', 'malparidez',
  'carechimba', 'carechimbas', 'chimba', 'chimbada', 'chimbas',
  'hijueputa', 'hijueputas', 'hijadeputa', 'hdp', 'hp', 'triplehijueputa',
  'marica', 'maricas', 'maricon', 'maricones', 'mariconada',
  'careverga', 'verga', 'vergazo', 'vergas',
  'careculo', 'culicagado', 'culo', 'culear',
  'mierda', 'mierdero', 'mierdoso',
  'pendejo', 'pendeja', 'pendejos', 'pendejadas',
  'estupido', 'estupida', 'estupidos', 'idiota', 'idiotas', 'imbecil', 'imbeciles',
  'zorra', 'zorras', 'perra', 'perras', 'puta', 'putas', 'puto', 'putos',
  'pirobo', 'pirobos', 'piroba', 'pirobas',
  'guiso', 'ñero', 'carepicha',

  // Violencia y amenazas
  'plomo', 'sicario', 'sicarios', 'matar', 'mato', 'te voy a matar', 'lo mato', 'amenaza',
  'secuestro', 'atraco', 'atracar', 'robar', 'ladron', 'ladrones', 'rata', 'ratas',
  'arma', 'armas', 'pistola', 'revolver',

  // Sustancias y estupefacientes
  'perico', 'coca', 'cocaina', 'marihuana', 'tusi', 'droga', 'drogas', 'hierba', 'bareta',

  // Estafas y spam
  'consigne ya', 'consignar ya', 'dinero facil', 'plata facil', 'gana en dolares',
  'piramide', 'cripto gratis', 'inversion segura', 'telegram clandestino',
  'escribeme al whatsapp', 'escribe al ws', 'pack de fotos', 'packs hot', 'onlyfans'
];

// Palabras o patrones de alerta moderada (sospechosos)
export const SUSPICIOUS_TERMS = [
  'whatsapp', 'ws', 'telegram', 'inbox', 'privado', 'link', 'http', 'https', 'www.',
  'transfiere', 'nequi', 'daviplata', 'bancolombia'
];

/**
 * Normaliza un texto removiendo acentos, signos de puntuación extra y espaciados de evasión
 * Ejemplo: "g-o-n-o-r-r-e-a" -> "gonorrea", "h.d.p" -> "hdp"
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/[-_.*+~#@!¡?¿,;:()]/g, ' ') // Separadores a espacios
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Analiza un mensaje y determina su nivel de riesgo y palabras detectadas
 * @param {string} text - Contenido del mensaje
 * @returns {{ level: 'safe' | 'suspicious' | 'toxic', score: number, matchedWords: Array<string>, reason: string }}
 */
export function analyzeMessageContent(text) {
  if (!text || typeof text !== 'string') {
    return { level: 'safe', score: 0, matchedWords: [], reason: 'Mensaje vacío o multimedia' };
  }

  const normalized = normalizeText(text);
  const compactNormalized = normalized.replace(/\s+/g, ''); // Para detectar evasión por espacios "h j p"
  const tokens = normalized.split(/\s+/);

  const matchedOffensive = [];
  const matchedSuspicious = [];

  // 1. Detección de términos ofensivos graves
  for (const term of OFFENSIVE_TERMS) {
    const termClean = normalizeText(term);
    const regex = new RegExp(`\\b${termClean}\\b`, 'i');
    if (regex.test(normalized) || tokens.includes(termClean) || (termClean.length >= 4 && compactNormalized.includes(termClean))) {
      matchedOffensive.push(term);
    }
  }

  // 2. Detección de términos sospechosos
  for (const term of SUSPICIOUS_TERMS) {
    const termClean = normalizeText(term);
    const regex = new RegExp(`\\b${termClean}\\b`, 'i');
    if (regex.test(normalized) || tokens.includes(termClean)) {
      matchedSuspicious.push(term);
    }
  }

  // 3. Detección de números de teléfono sospechosos (10 dígitos típicos en Colombia ej. 3171234567)
  const phoneRegex = /\b3\d{9}\b/;
  if (phoneRegex.test(compactNormalized) && !matchedSuspicious.includes('número telefónico')) {
    matchedSuspicious.push('número telefónico externo');
  }

  // Clasificación final
  if (matchedOffensive.length > 0) {
    return {
      level: 'toxic',
      score: Math.min(100, 60 + matchedOffensive.length * 20),
      matchedWords: [...new Set(matchedOffensive)],
      reason: `Detectado lenguaje ofensivo o inapropiado: "${matchedOffensive.slice(0, 3).join(', ')}"`
    };
  }

  if (matchedSuspicious.length > 0) {
    return {
      level: 'suspicious',
      score: Math.min(50, 25 + matchedSuspicious.length * 15),
      matchedWords: [...new Set(matchedSuspicious)],
      reason: `Detectados posibles enlaces, números o términos sospechosos: "${matchedSuspicious.slice(0, 3).join(', ')}"`
    };
  }

  return {
    level: 'safe',
    score: 0,
    matchedWords: [],
    reason: 'Mensaje seguro y respetuoso'
  };
}

/**
 * Función auxiliar para resaltar visualmente las palabras ofensivas en un texto
 * @param {string} text - Texto original
 * @param {Array<string>} wordsToHighlight - Lista de palabras a resaltar
 * @returns {Array<{ text: string, isOffensive: boolean }>}
 */
export function getHighlightedSegments(text, wordsToHighlight = []) {
  if (!text || !wordsToHighlight || wordsToHighlight.length === 0) {
    return [{ text: text || '', isOffensive: false }];
  }

  try {
    const escapedWords = wordsToHighlight
      .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .filter(Boolean);
    if (escapedWords.length === 0) return [{ text, isOffensive: false }];

    const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map(part => {
      const isMatch = wordsToHighlight.some(w => w.toLowerCase() === part.toLowerCase());
      return { text: part, isOffensive: isMatch };
    });
  } catch (_) {
    return [{ text, isOffensive: false }];
  }
}
