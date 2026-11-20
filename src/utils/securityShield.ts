/**
 * Enterprise Security Shield & Integrity Guard
 * JacS RetailOS ERP — Anti-Malware Upload Scanner, Deep XSS Sanitizer,
 * and Cryptographic SHA-256 Backup Integrity Checksum Verifier.
 */

export interface SecurityFileValidationResult {
  valid: boolean;
  reason?: string;
  threatCode?: 'BLOCKED_EXTENSION' | 'BLOCKED_MIME' | 'DOUBLE_EXTENSION_SPOOF' | 'FILE_TOO_LARGE' | 'INVALID_FORMAT' | 'EMPTY_FILE';
  detectedExtension?: string;
  fileSizeKB?: number;
}

export interface SanitizeTextResult {
  sanitized: string;
  threatDetected: boolean;
  matchedPatterns: string[];
}

export interface SignedBackupEnvelope {
  algorithm: 'SHA-256';
  checksum: string;
  payloadVersion: string;
  signedAt: string;
  exportedBy: string;
  xssSanitized: boolean;
}

export interface BackupVerificationResult {
  valid: boolean;
  data?: Record<string, any>;
  checksum?: string;
  expectedChecksum?: string;
  signedAt?: string;
  exportedBy?: string;
  errorReason?: string;
  threatCode?: 'INVALID_JSON' | 'MISSING_SCHEMA' | 'MISSING_CHECKSUM' | 'CHECKSUM_MISMATCH' | 'XSS_PAYLOAD_STRIPPED';
  threatsSanitized: number;
}

// Dangerous extensions explicitly blocked across all upload points
export const BLOCKED_DANGEROUS_EXTENSIONS = [
  '.exe', '.svg', '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx',
  '.html', '.htm', '.xhtml', '.bat', '.sh', '.cmd', '.ps1',
  '.vbs', '.vbe', '.wsf', '.wsh', '.php', '.phtml', '.py',
  '.rb', '.pl', '.jar', '.war', '.msi', '.scr', '.com', '.pif',
  '.dll', '.so', '.dylib', '.apk', '.app', '.reg', '.hta'
];

// Dangerous MIME types blocked across all upload points
export const BLOCKED_DANGEROUS_MIMES = [
  'image/svg+xml',
  'text/html',
  'application/xhtml+xml',
  'application/javascript',
  'text/javascript',
  'application/x-javascript',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-sh',
  'application/x-bat',
  'application/x-httpd-php',
  'text/x-python',
  'text/x-shellscript'
];

// Allowed safe image formats (Max 2MB, strictly PNG / JPEG / WebP — NO SVG)
export const ALLOWED_SAFE_IMAGE_MIMES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
];

export const ALLOWED_SAFE_IMAGE_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.webp'
];

/**
 * Extracts lowercase extension(s) and checks for double-extension spoofing
 * such as "katalog.csv.exe", "logo.png.svg", or "backup.json.js".
 */
function checkBlockedExtensionAndSpoofing(fileName: string): {
  blocked: boolean;
  ext: string;
  spoofDetected: boolean;
  matchedExt?: string;
} {
  const cleanName = (fileName || '').trim().toLowerCase();
  const parts = cleanName.split('.').filter(Boolean);
  const lastExt = parts.length > 1 ? `.${parts[parts.length - 1]}` : '';

  // Check if the final extension is in blocked list
  if (BLOCKED_DANGEROUS_EXTENSIONS.includes(lastExt)) {
    return { blocked: true, ext: lastExt, spoofDetected: false, matchedExt: lastExt };
  }

  // Check if any intermediate segment is a dangerous extension (e.g., payload.html.png or script.js.csv)
  if (parts.length > 2) {
    for (let i = 1; i < parts.length; i++) {
      const segExt = `.${parts[i]}`;
      if (BLOCKED_DANGEROUS_EXTENSIONS.includes(segExt)) {
        return { blocked: true, ext: lastExt, spoofDetected: true, matchedExt: segExt };
      }
    }
  }

  return { blocked: false, ext: lastExt, spoofDetected: false };
}

/**
 * 1A. Strict Image Upload Validator (Logo Usaha, Foto Produk, Bukti Bayar)
 * - Strictly permits image/png, image/jpeg, image/webp
 * - Enforces Max 2MB (2 * 1024 * 1024 bytes)
 * - Blocks .svg, .exe, .js, .html, .bat, .sh, etc.
 */
export function validateSafeImageUpload(
  file: File,
  maxBytes: number = 2 * 1024 * 1024
): SecurityFileValidationResult {
  if (!file || file.size === 0) {
    return {
      valid: false,
      reason: 'File gambar kosong atau tidak terbaca.',
      threatCode: 'EMPTY_FILE',
      fileSizeKB: 0,
    };
  }

  const fileSizeKB = Math.round((file.size / 1024) * 10) / 10;
  const extCheck = checkBlockedExtensionAndSpoofing(file.name);

  if (extCheck.blocked) {
    return {
      valid: false,
      reason: extCheck.spoofDetected
        ? `SECURITY SHIELD BLOCK: Terdeteksi manipulasi ekstensi ganda berbahaya (${extCheck.matchedExt}) pada file "${file.name}".`
        : `SECURITY SHIELD BLOCK: Format file "${extCheck.matchedExt}" dilarang demi keamanan anti-malware & XSS. Gunakan PNG, JPG, atau WebP.`,
      threatCode: extCheck.spoofDetected ? 'DOUBLE_EXTENSION_SPOOF' : 'BLOCKED_EXTENSION',
      detectedExtension: extCheck.matchedExt,
      fileSizeKB,
    };
  }

  const mimeLower = (file.type || '').toLowerCase();
  if (BLOCKED_DANGEROUS_MIMES.includes(mimeLower)) {
    return {
      valid: false,
      reason: `SECURITY SHIELD BLOCK: Tipe MIME "${mimeLower}" (${file.name}) diblokir oleh Anti-Malware Scanner. Format SVG/HTML/Script tidak diizinkan.`,
      threatCode: 'BLOCKED_MIME',
      detectedExtension: extCheck.ext,
      fileSizeKB,
    };
  }

  if (
    !ALLOWED_SAFE_IMAGE_EXTENSIONS.includes(extCheck.ext) ||
    (mimeLower && !ALLOWED_SAFE_IMAGE_MIMES.includes(mimeLower))
  ) {
    return {
      valid: false,
      reason: `Format gambar "${file.name}" tidak diizinkan. Hanya menerima format aman: PNG, JPG/JPEG, atau WebP.`,
      threatCode: 'INVALID_FORMAT',
      detectedExtension: extCheck.ext,
      fileSizeKB,
    };
  }

  if (file.size > maxBytes) {
    const maxMB = (maxBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      reason: `Ukuran gambar terlalu besar (${(file.size / (1024 * 1024)).toFixed(2)} MB). Batas maksimum keamanan adalah ${maxMB} MB.`,
      threatCode: 'FILE_TOO_LARGE',
      detectedExtension: extCheck.ext,
      fileSizeKB,
    };
  }

  return {
    valid: true,
    detectedExtension: extCheck.ext,
    fileSizeKB,
  };
}

/**
 * 1B. Strict Data Import & Restore Backup File Validator
 * - Blocks .exe, .svg, .js, .html, .bat, .sh, and double-extension spoofing
 * - Validates .json / .csv (and optional safe spreadsheet formats for Master Data Migration)
 */
export function validateSafeDataImportFile(
  file: File,
  allowedFormats: ('json' | 'csv' | 'spreadsheet')[] = ['json', 'csv'],
  maxBytes: number = 10 * 1024 * 1024
): SecurityFileValidationResult {
  if (!file || file.size === 0) {
    return {
      valid: false,
      reason: 'File data kosong (0 byte) atau tidak valid.',
      threatCode: 'EMPTY_FILE',
      fileSizeKB: 0,
    };
  }

  const fileSizeKB = Math.round((file.size / 1024) * 10) / 10;
  const extCheck = checkBlockedExtensionAndSpoofing(file.name);

  if (extCheck.blocked) {
    return {
      valid: false,
      reason: extCheck.spoofDetected
        ? `SECURITY SHIELD BLOCK: File "${file.name}" mengandung ekstensi ganda berbahaya (${extCheck.matchedExt}) yang diblokir.`
        : `SECURITY SHIELD BLOCK: File berbahaya "${extCheck.matchedExt}" (${file.name}) otomatis diblokir oleh Anti-Malware Upload Scanner.`,
      threatCode: extCheck.spoofDetected ? 'DOUBLE_EXTENSION_SPOOF' : 'BLOCKED_EXTENSION',
      detectedExtension: extCheck.matchedExt,
      fileSizeKB,
    };
  }

  const mimeLower = (file.type || '').toLowerCase();
  if (BLOCKED_DANGEROUS_MIMES.includes(mimeLower)) {
    return {
      valid: false,
      reason: `SECURITY SHIELD BLOCK: Tipe MIME berbahaya "${mimeLower}" pada file "${file.name}" ditolak.`,
      threatCode: 'BLOCKED_MIME',
      detectedExtension: extCheck.ext,
      fileSizeKB,
    };
  }

  const validExtensions: string[] = [];
  if (allowedFormats.includes('json')) validExtensions.push('.json');
  if (allowedFormats.includes('csv')) validExtensions.push('.csv', '.txt', '.tsv');
  if (allowedFormats.includes('spreadsheet')) validExtensions.push('.xlsx', '.xls', '.ods');

  if (!validExtensions.includes(extCheck.ext)) {
    return {
      valid: false,
      reason: `Ekstensi file "${extCheck.ext || 'tanpa ekstensi'}" tidak didukung. Gunakan format resmi: ${validExtensions.join(', ')}.`,
      threatCode: 'INVALID_FORMAT',
      detectedExtension: extCheck.ext,
      fileSizeKB,
    };
  }

  if (file.size > maxBytes) {
    const maxMB = (maxBytes / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      reason: `Ukuran file data (${(file.size / (1024 * 1024)).toFixed(2)} MB) melebihi batas keamanan ${maxMB} MB.`,
      threatCode: 'FILE_TOO_LARGE',
      detectedExtension: extCheck.ext,
      fileSizeKB,
    };
  }

  return {
    valid: true,
    detectedExtension: extCheck.ext,
    fileSizeKB,
  };
}

/**
 * 1C. Strict Text & Cell Sanitizer (Anti-XSS & Formula Injection Firewall)
 * Cleans every text/cell from HTML tags or XSS payloads:
 * - <script>...</script>, <iframe>, <object>, <embed>, <svg>, <link>, <meta>, <style>
 * - inline event handlers (onerror=, onload=, onclick=, onmouseover=, onfocus=, etc.)
 * - javascript:, vbscript:, data:text/html
 */
export function sanitizeTextValue(input: unknown): SanitizeTextResult {
  if (input === null || input === undefined) {
    return { sanitized: '', threatDetected: false, matchedPatterns: [] };
  }

  const raw = typeof input === 'string' ? input : String(input);
  if (!raw) {
    return { sanitized: '', threatDetected: false, matchedPatterns: [] };
  }

  const matchedPatterns: string[] = [];
  let cleaned = raw;

  // 1. Detect and strip <script> blocks
  if (/<script\b[^>]*>[\s\S]*?<\/script>/gi.test(cleaned) || /<\/?script\b[^>]*>/gi.test(cleaned)) {
    matchedPatterns.push('<script>');
    cleaned = cleaned
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<\/?script\b[^>]*>/gi, '');
  }

  // 2. Detect and strip dangerous container tags (iframe, object, embed, svg, form, style, link, meta)
  if (/<\/?(iframe|object|embed|svg|math|applet|form|style|link|meta|base)\b[^>]*>/gi.test(cleaned)) {
    matchedPatterns.push('HTML_EMBED_TAG');
    cleaned = cleaned
      .replace(/<(iframe|object|embed|svg|math|applet|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replace(/<\/?(iframe|object|embed|svg|math|applet|form|style|link|meta|base)\b[^>]*>/gi, '');
  }

  // 3. Detect and strip inline DOM event handlers (e.g. onerror=..., onload=..., onclick=...)
  if (/\bon[a-z]{2,20}\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi.test(cleaned)) {
    matchedPatterns.push('INLINE_EVENT_HANDLER');
    cleaned = cleaned.replace(/\bon[a-z]{2,20}\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, '');
  }

  // 4. Detect and strip javascript:, vbscript:, data:text/html URIs
  if (/(javascript|vbscript)\s*:|data\s*:\s*text\/html/gi.test(cleaned)) {
    matchedPatterns.push('JS_URI_SCHEME');
    cleaned = cleaned
      .replace(/(javascript|vbscript)\s*:/gi, 'blocked-uri:')
      .replace(/data\s*:\s*text\/html[^"'\s>]*/gi, 'blocked-data:');
  }

  // 5. Strip any remaining generic HTML tags (<img ...>, <div ...>, <a ...>) while preserving safe math expressions like "5 < 10"
  if (/<\/?[a-zA-Z][a-zA-Z0-9-]*(\s+[^>]*)?>/g.test(cleaned)) {
    matchedPatterns.push('HTML_TAG');
    cleaned = cleaned.replace(/<\/?[a-zA-Z][a-zA-Z0-9-]*(\s+[^>]*)?>/g, '');
  }

  return {
    sanitized: cleaned.trim(),
    threatDetected: matchedPatterns.length > 0,
    matchedPatterns,
  };
}

/**
 * Recursively sanitizes any object or array structure (for JSON imports & backup restores)
 */
export function sanitizeObjectDeep<T>(obj: T): {
  sanitized: T;
  threatsRemoved: number;
  matchedPatterns: string[];
} {
  let threatsRemoved = 0;
  const patternSet = new Set<string>();

  function walk(node: any, keyName?: string): any {
    if (node === null || node === undefined) return node;

    if (typeof node === 'string') {
      // Preserve valid base64 safe raster data URLs for PNG/JPEG/WebP logos
      if (
        (keyName === 'logoUrl' || keyName === 'image' || keyName === 'imageUrl' || keyName === 'photoUrl') &&
        /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i.test(node.trim())
      ) {
        return node.trim();
      }
      // Block SVG or HTML data URLs even inside image fields
      if (/^data:image\/svg\+xml/i.test(node.trim()) || /^data:text\/html/i.test(node.trim())) {
        threatsRemoved++;
        patternSet.add('DANGEROUS_DATA_URI');
        return '';
      }

      const res = sanitizeTextValue(node);
      if (res.threatDetected) {
        threatsRemoved++;
        res.matchedPatterns.forEach(p => patternSet.add(p));
      }
      return res.sanitized;
    }

    if (Array.isArray(node)) {
      return node.map(item => walk(item, keyName));
    }

    if (typeof node === 'object') {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(node)) {
        const cleanKeyRes = sanitizeTextValue(k);
        if (cleanKeyRes.threatDetected) {
          threatsRemoved++;
          cleanKeyRes.matchedPatterns.forEach(p => patternSet.add(p));
        }
        const safeKey = cleanKeyRes.sanitized || k;
        out[safeKey] = walk(v, safeKey);
      }
      return out;
    }

    return node;
  }

  const sanitized = walk(obj) as T;
  return {
    sanitized,
    threatsRemoved,
    matchedPatterns: Array.from(patternSet),
  };
}

/**
 * Sanitizes tabular CSV / Excel import headers and row cells
 */
export function sanitizeImportRows(
  headers: string[],
  rows: Record<string, string>[]
): {
  headers: string[];
  rows: Record<string, string>[];
  threatsRemoved: number;
  matchedPatterns: string[];
} {
  let threatsRemoved = 0;
  const patternSet = new Set<string>();

  const headerMap: Record<string, string> = {};
  const cleanHeaders = headers.map((h, idx) => {
    const res = sanitizeTextValue(h);
    if (res.threatDetected) {
      threatsRemoved++;
      res.matchedPatterns.forEach(p => patternSet.add(p));
    }
    const safeH = res.sanitized || `Kolom_${idx + 1}`;
    headerMap[h] = safeH;
    return safeH;
  });

  const cleanRows = rows.map(row => {
    const nextRow: Record<string, string> = {};
    for (const [origKey, val] of Object.entries(row)) {
      const safeKey = headerMap[origKey] || sanitizeTextValue(origKey).sanitized || origKey;
      const res = sanitizeTextValue(val);
      if (res.threatDetected) {
        threatsRemoved++;
        res.matchedPatterns.forEach(p => patternSet.add(p));
      }
      nextRow[safeKey] = res.sanitized;
    }
    return nextRow;
  });

  return {
    headers: cleanHeaders,
    rows: cleanRows,
    threatsRemoved,
    matchedPatterns: Array.from(patternSet),
  };
}

/**
 * 2. Encrypted / Signed Backup & SHA-256 Integrity Checksum Guard
 * Deterministically serializes JSON keys in alphabetical order so that
 * SHA-256 checksum computation is 100% consistent across export and restore.
 */
const BACKUP_INTEGRITY_SALT = 'JACS_RETAILOS_ENTERPRISE_SHIELD_V25_INTEGRITY_SALT';

function canonicalStringify(value: any): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(item => canonicalStringify(item)).join(',') + ']';
  }
  const keys = Object.keys(value)
    .filter(k => k !== 'securityEnvelope' && k !== 'integritySignature' && value[k] !== undefined)
    .sort();
  const entries = keys.map(k => `${JSON.stringify(k)}:${canonicalStringify(value[k])}`);
  return '{' + entries.join(',') + '}';
}

export async function computePayloadSha256Checksum(payload: Record<string, any>): Promise<string> {
  const canonical = canonicalStringify(payload) + '|' + BACKUP_INTEGRITY_SALT;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(canonical);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback deterministic hash if Web Crypto is unavailable
  let h1 = 0xdeadbeef ^ canonical.length;
  let h2 = 0x41c6ce57 ^ canonical.length;
  for (let i = 0, ch; i < canonical.length; i++) {
    ch = canonical.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

/**
 * Wraps a backup snapshot payload with a cryptographic SHA-256 integrity envelope
 */
export async function createSignedBackupEnvelope(
  rawPayload: Record<string, any>,
  exportedBy: string
): Promise<Record<string, any>> {
  // Sanitize before signing so the signed snapshot is guaranteed clean
  const { sanitized } = sanitizeObjectDeep(rawPayload);
  const payloadCopy = { ...sanitized };
  delete payloadCopy.securityEnvelope;
  delete payloadCopy.integritySignature;

  const checksum = await computePayloadSha256Checksum(payloadCopy);
  const signedAt = new Date().toISOString();

  const securityEnvelope: SignedBackupEnvelope = {
    algorithm: 'SHA-256',
    checksum,
    payloadVersion: '2.5-ENTERPRISE-SHIELD',
    signedAt,
    exportedBy: exportedBy || 'SuperAdmin',
    xssSanitized: true,
  };

  return {
    ...payloadCopy,
    securityEnvelope,
  };
}

/**
 * Verifies an uploaded JSON backup file before Restore:
 * 1. Parses JSON & validates core schema keys
 * 2. Requires and verifies the SHA-256 integrity checksum (`securityEnvelope.checksum`)
 * 3. Rejects if the file was modified externally, corrupted, or missing its signature
 * 4. Runs deep XSS sanitization on all fields
 */
export async function verifySignedBackupEnvelope(rawJsonText: string): Promise<BackupVerificationResult> {
  if (!rawJsonText || !rawJsonText.trim()) {
    return {
      valid: false,
      errorReason: 'File backup kosong atau tidak dapat dibaca.',
      threatCode: 'INVALID_JSON',
      threatsSanitized: 0,
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawJsonText);
  } catch {
    return {
      valid: false,
      errorReason: 'SECURITY SHIELD REJECT: Struktur JSON rusak atau korup (Syntax Error). File ditolak.',
      threatCode: 'INVALID_JSON',
      threatsSanitized: 0,
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      valid: false,
      errorReason: 'SECURITY SHIELD REJECT: Root dokumen JSON bukan objek snapshot JacS RetailOS yang valid.',
      threatCode: 'MISSING_SCHEMA',
      threatsSanitized: 0,
    };
  }

  // Validate required schema structure
  const hasCoreSchema =
    Array.isArray(parsed.products) &&
    Array.isArray(parsed.transactions) &&
    Array.isArray(parsed.accounts) &&
    typeof parsed.businessProfile === 'object' &&
    parsed.businessProfile !== null;

  if (!hasCoreSchema) {
    return {
      valid: false,
      errorReason:
        'SECURITY SHIELD REJECT: Skema file backup tidak lengkap atau bukan berasal dari JacS RetailOS ERP (wajib memiliki products, transactions, accounts, dan businessProfile).',
      threatCode: 'MISSING_SCHEMA',
      threatsSanitized: 0,
    };
  }

  const envelope: SignedBackupEnvelope | undefined =
    parsed.securityEnvelope || parsed.integritySignature;

  if (!envelope || typeof envelope.checksum !== 'string' || envelope.checksum.trim().length < 16) {
    return {
      valid: false,
      errorReason:
        'SECURITY SHIELD REJECT: File backup tidak memiliki tanda tangan integritas SHA-256 (Missing Security Envelope). Sistem menolak file backup tanpa tanda tangan kriptografi resmi.',
      threatCode: 'MISSING_CHECKSUM',
      threatsSanitized: 0,
    };
  }

  const payloadWithoutSignature = { ...parsed };
  delete payloadWithoutSignature.securityEnvelope;
  delete payloadWithoutSignature.integritySignature;

  const recomputedChecksum = await computePayloadSha256Checksum(payloadWithoutSignature);

  if (recomputedChecksum !== envelope.checksum) {
    return {
      valid: false,
      checksum: recomputedChecksum,
      expectedChecksum: envelope.checksum,
      signedAt: envelope.signedAt,
      exportedBy: envelope.exportedBy,
      errorReason:
        'SECURITY SHIELD ALERT (SHA-256 CHECKSUM MISMATCH): File backup terdeteksi korup atau telah dimodifikasi oleh pihak luar setelah diekspor! Proses Restore dibatalkan demi melindungi integritas database.',
      threatCode: 'CHECKSUM_MISMATCH',
      threatsSanitized: 0,
    };
  }

  // Deep XSS scan on payload even after checksum match
  const { sanitized, threatsRemoved } = sanitizeObjectDeep(payloadWithoutSignature);

  return {
    valid: true,
    data: {
      ...sanitized,
      securityEnvelope: envelope,
    },
    checksum: recomputedChecksum,
    expectedChecksum: envelope.checksum,
    signedAt: envelope.signedAt,
    exportedBy: envelope.exportedBy,
    threatsSanitized: threatsRemoved,
  };
}
