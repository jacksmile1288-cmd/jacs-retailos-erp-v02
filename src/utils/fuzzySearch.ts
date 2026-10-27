/**
 * AI Smart Data Harmonizer & Quick Fuzzy Search Utilities
 * Provides resilient, typo-tolerant matching for retail catalog items,
 * along with data normalization for unit of measure (UOM), numbers/currency,
 * title-casing, and duplicate detection.
 */

// ---------------------------------------------------------------------------
// 1. FUZZY STRING MATCHING & SIMILARITY
// ---------------------------------------------------------------------------

/**
 * Normalizes text: lowercase, strips punctuation/diacritics, compresses whitespace
 */
export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates Levenshtein Distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];
  for (let i = 0; i <= bn; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[bn][an];
}

/**
 * Checks if string 'sub' is a subsequence of string 'full' (preserving order)
 */
export function isSubsequence(sub: string, full: string): boolean {
  if (!sub || !full) return false;
  let i = 0;
  let j = 0;
  while (i < sub.length && j < full.length) {
    if (sub[i] === full[j]) {
      i++;
    }
    j++;
  }
  return i === sub.length;
}

/**
 * Common Indonesian retail word abbreviations dictionary
 */
export const COMMON_RETAIL_ABBREVIATIONS: Record<string, string> = {
  grg: 'goreng',
  bkr: 'bakar',
  kntg: 'kentang',
  kptg: 'kepiting',
  pds: 'pedas',
  mnyak: 'minyak',
  myk: 'minyak',
  btl: 'botol',
  bks: 'bungkus',
  sch: 'sachet',
  sct: 'sachet',
  kcl: 'kecil',
  bsr: 'besar',
  spcl: 'spesial',
  spesial: 'spesial',
  kcg: 'kacang',
  cklt: 'cokelat',
  stb: 'stroberi',
  van: 'vanila',
  kj: 'keju',
  indomi: 'indomie',
  bbq: 'barbeque',
  ori: 'original',
  instan: 'instant',
  ind: 'indomie',
  aqu: 'aqua',
  kopi: 'kopi',
  susu: 'susu',
  teh: 'teh',
  sbg: 'sembako',
  dus: 'dus',
  ctn: 'karton',
};

/**
 * Computes similarity ratio between 0 and 1 using Levenshtein distance
 */
export function stringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeSearchText(str1);
  const s2 = normalizeSearchText(str2);
  if (!s1 && !s2) return 1;
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  const dist = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Evaluates whether a target string matches a query with typo tolerance and acronym/token flexibility.
 * Handles cases like:
 * - "indomi" -> matches "Indomie"
 * - "indomie grg" -> matches "Indomie Goreng"
 * - "aqua 600" -> matches "Aqua 600ml"
 * - token permutation & substring containment
 */
export function fuzzyMatch(
  target: string | null | undefined,
  query: string | null | undefined,
  minThreshold = 0.65
): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;

  const normTarget = normalizeSearchText(target);
  const normQuery = normalizeSearchText(query);
  if (!normTarget) return false;
  if (!normQuery) return true;

  // Direct substring match
  if (normTarget.includes(normQuery)) return true;

  // Subsequence matching (e.g. "ig" matches "indomie goreng")
  const targetChars = normTarget.replace(/\s+/g, '');
  const queryChars = normQuery.replace(/\s+/g, '');
  if (targetChars.includes(queryChars)) return true;

  // Token-by-token validation
  const queryTokens = normQuery.split(' ').filter(Boolean);
  const targetTokens = normTarget.split(' ').filter(Boolean);

  if (queryTokens.length === 0) return true;

  // Every token in query must either:
  // 1. Be a substring of some token or whole target (e.g. "600" in "600ml")
  // 2. Or be a prefix/suffix or known abbreviation
  // 3. Or have high similarity with at least one token in target
  const allTokensMatched = queryTokens.every((qTok) => {
    // 1. Direct token substring or target contains qTok
    if (normTarget.includes(qTok)) return true;

    // 2. Token abbreviation check (e.g. "grg" matching "goreng", "indomi" matching "indomie")
    const mappedAbbr = COMMON_RETAIL_ABBREVIATIONS[qTok];
    if (mappedAbbr && normTarget.includes(mappedAbbr)) return true;

    const isAbbreviation = targetTokens.some((tTok) => {
      if (tTok.startsWith(qTok)) return true;
      if (tTok.includes(qTok)) return true;
      if (mappedAbbr && (tTok.startsWith(mappedAbbr) || mappedAbbr.startsWith(tTok))) return true;

      // Subsequence check for retail abbreviations (e.g. "grg" in "goreng", "bkr" in "bakar")
      if (qTok.length >= 2 && isSubsequence(qTok, tTok) && qTok[0] === tTok[0]) return true;

      if (qTok.length >= 2 && tTok.length >= 4) {
        // Consonant skeleton check
        const qCons = qTok.replace(/[aeiou]/g, '');
        const tCons = tTok.replace(/[aeiou]/g, '');
        if (qCons && isSubsequence(qCons, tCons)) return true;
      }
      return false;
    });
    if (isAbbreviation) return true;

    // 3. Typo-tolerant distance check per token
    return targetTokens.some((tTok) => {
      // Small words allowed max 1 distance, larger words allowed 2
      const maxDistance = qTok.length <= 4 ? 1 : 2;
      const dist = levenshteinDistance(qTok, tTok);
      if (dist <= maxDistance) return true;
      return stringSimilarity(qTok, tTok) >= minThreshold;
    });
  });

  if (allTokensMatched) return true;

  // Global full string similarity check
  return stringSimilarity(normTarget, normQuery) >= minThreshold;
}

/**
 * Searches across multiple fields of an entity with fuzzy matching
 */
export function fuzzyMatchAny(
  fields: (string | null | undefined)[],
  query: string | null | undefined,
  minThreshold = 0.65
): boolean {
  if (!query || !query.trim()) return true;
  return fields.some((f) => fuzzyMatch(f, query, minThreshold));
}

// ---------------------------------------------------------------------------
// 2. AI SMART DATA HARMONIZER & NORMALIZATION
// ---------------------------------------------------------------------------

/**
 * Standardize Unit of Measure (UOM)
 * Maps common Indonesian retail abbreviations to canonical units
 */
export function normalizeUOM(val: string | null | undefined): string {
  if (!val) return 'PCS';
  const clean = val.trim().toLowerCase();

  // PCS / Pieces / Buah / Biji
  if (/^(pcs|pc|piece|pieces|buah|biji|bh|bji|item|pkt|paket)$/i.test(clean)) {
    return 'PCS';
  }

  // Botol
  if (/^(btl|botol|bottle|btls|bt)$/i.test(clean)) {
    return 'Botol';
  }

  // Dus / Karton / Box
  if (/^(dus|karton|ctn|karton\s*box|krt|box|bx|kardus)$/i.test(clean)) {
    return 'Dus';
  }

  // Kaleng / Can
  if (/^(klg|kaleng|can|tin)$/i.test(clean)) {
    return 'Kaleng';
  }

  // Bungkus / Sachet / Pouch
  if (/^(bks|bungkus|bgks|pack|pak|bks)$/i.test(clean)) {
    return 'Bungkus';
  }
  if (/^(sachet|sct|skt)$/i.test(clean)) {
    return 'Sachet';
  }
  if (/^(pouch|pch)$/i.test(clean)) {
    return 'Pouch';
  }

  // Kilogram / Gram / Liter / Mililiter
  if (/^(kg|kilogram|kilo)$/i.test(clean)) {
    return 'KG';
  }
  if (/^(gr|gram|g)$/i.test(clean)) {
    return 'Gram';
  }
  if (/^(l|ltr|liter)$/i.test(clean)) {
    return 'Liter';
  }
  if (/^(ml|mililiter|mili)$/i.test(clean)) {
    return 'ML';
  }

  // Roll / Slop / Renteng
  if (/^(roll|rol)$/i.test(clean)) {
    return 'Roll';
  }
  if (/^(slop|slp)$/i.test(clean)) {
    return 'Slop';
  }
  if (/^(rtg|renteng)$/i.test(clean)) {
    return 'Renteng';
  }

  // Default to Title Case
  return toTitleCase(clean);
}

/**
 * Cleans monetary and numerical strings into pure integer/float values
 * Examples:
 * - "Rp 15.000,-" -> 15000
 * - "15,000.00" -> 15000
 * - " 25.500 " -> 25500
 */
export function cleanFinancialNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val);
  if (!val) return 0;

  let str = String(val).trim();

  // Strip currency prefixes and suffix formatting
  str = str.replace(/^(rp\.?|idr|\$)\s*/i, '');
  str = str.replace(/,\s*-+$/, ''); // Strip ",-"
  str = str.replace(/\s+/g, '');

  if (!str) return 0;

  // Handle standard Indonesian format "15.000,00" vs Western "15,000.00"
  if (str.includes('.') && str.includes(',')) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastDot < lastComma) {
      // Indonesian: "15.000,00" -> remove dots, convert comma to dot
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Western: "15,000.00" -> remove commas
      str = str.replace(/,/g, '');
    }
  } else if (str.includes('.')) {
    // Check if dot is thousands separator: e.g. "15.000" or decimal "15.5"
    const parts = str.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      str = str.replace(/\./g, '');
    }
  } else if (str.includes(',')) {
    // Check if comma is thousands separator: e.g. "15,000" or decimal "15,5"
    const parts = str.split(',');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(',', '.');
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num);
}

/**
 * Transforms string into Title Case with acronym preservation (e.g. "UHT", "SKU", "PCS", "LED")
 */
export function toTitleCase(str: string | null | undefined): string {
  if (!str) return '';

  const acronyms = new Set([
    'uht',
    'sku',
    'pcs',
    'id',
    'en',
    'led',
    'tv',
    'ac',
    'usb',
    'cd',
    'dvd',
    'pt',
    'cv',
    'ud',
    'pic',
    'po',
    'gr',
    'pr',
    'top',
    'wa',
    'hp',
    'ean',
    'upc',
    'plu',
    'bom',
    'ppn',
    'vat',
    'kg',
    'ml',
  ]);

  const minorWords = new Set(['dan', 'and', 'di', 'ke', 'dari', 'of', 'in', 'on', 'at', 'to', 'for', 'the', '&']);

  return str
    .toLowerCase()
    .split(/([ \-_/()]+)/)
    .map((word, idx) => {
      const trimmed = word.trim().toLowerCase();
      if (!trimmed) return word;

      if (acronyms.has(trimmed)) {
        return trimmed.toUpperCase();
      }

      if (idx > 0 && minorWords.has(trimmed)) {
        return trimmed;
      }

      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    })
    .join('');
}

/**
 * Computes composite semantic similarity between two names
 * Takes into account character distance, token overlap, abbreviations, and substring containment
 */
export function computeSemanticSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeSearchText(str1);
  const norm2 = normalizeSearchText(str2);
  if (norm1 === norm2) return 1;
  if (!norm1 || !norm2) return 0;

  // 1. Direct Levenshtein similarity
  const levSim = stringSimilarity(norm1, norm2);

  // 2. Token Jaccard / Soft Token Similarity
  const tok1 = norm1.split(' ').filter(Boolean);
  const tok2 = norm2.split(' ').filter(Boolean);
  if (tok1.length === 0 || tok2.length === 0) return levSim;

  let matchedToks = 0;
  for (const t of tok1) {
    if (
      tok2.some(
        (u) =>
          u === t ||
          stringSimilarity(u, t) >= 0.8 ||
          COMMON_RETAIL_ABBREVIATIONS[t] === u ||
          COMMON_RETAIL_ABBREVIATIONS[u] === t ||
          (u.length >= 3 && isSubsequence(u, t) && u[0] === t[0]) ||
          (t.length >= 3 && isSubsequence(t, u) && t[0] === u[0])
      )
    ) {
      matchedToks++;
    }
  }

  const tokenOverlap = (matchedToks * 2) / (tok1.length + tok2.length);

  // Substring containment ratio (if one is nearly wholly contained in the other)
  const [shorter, longer] = norm1.length < norm2.length ? [norm1, norm2] : [norm2, norm1];
  const containsRatio = longer.includes(shorter) ? shorter.length / longer.length : 0;

  return Math.max(levSim, tokenOverlap, containsRatio >= 0.8 ? containsRatio : 0);
}

/**
 * Checks semantic duplicates between an imported item name and existing catalog items
 * Returns the matched item and similarity percentage if above threshold
 */
export function findSemanticDuplicateCandidate(
  importName: string,
  catalog: { id: string; name: string }[],
  threshold = 0.85
): { matchedId: string; matchedName: string; similarity: number } | null {
  if (!importName || !importName.trim() || !catalog || catalog.length === 0) {
    return null;
  }

  const normImport = normalizeSearchText(importName);
  let bestMatch: { matchedId: string; matchedName: string; similarity: number } | null = null;

  for (const cat of catalog) {
    const normCat = normalizeSearchText(cat.name);
    if (!normCat) continue;

    // Exact normalized match is 100%
    if (normImport === normCat) {
      return { matchedId: cat.id, matchedName: cat.name, similarity: 1.0 };
    }

    const sim = computeSemanticSimilarity(normImport, normCat);
    if (sim >= threshold && (!bestMatch || sim > bestMatch.similarity)) {
      bestMatch = { matchedId: cat.id, matchedName: cat.name, similarity: sim };
    }
  }

  return bestMatch;
}
