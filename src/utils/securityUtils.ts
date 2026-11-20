import { User } from '../types';

export async function hashSha256(message: string): Promise<string> {
  try {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      hash = (hash << 5) - hash + message.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}

// Synchronous simple hash for instant lookups
export function hashSync(message: string): string {
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    hash = (hash << 5) - hash + message.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

const SESSION_SECRET = 'JACS_RETAILOS_SECURE_KEY_2026';

export async function signSessionPayload(user: User): Promise<string> {
  const expiresAt = Date.now() + 8 * 3600 * 1000; // 8 hours session expiration
  const payload = {
    ...user,
    _expiresAt: expiresAt,
    _nonce: Math.random().toString(36).substring(2)
  };
  const jsonStr = JSON.stringify(payload);
  const signature = await hashSha256(jsonStr + SESSION_SECRET);
  return btoa(JSON.stringify({ payload, sig: signature }));
}

export async function verifyAndDecodeSession(encodedSession: string): Promise<User | null> {
  try {
    if (!encodedSession) return null;
    const decoded = JSON.parse(atob(encodedSession));
    const { payload, sig } = decoded;
    if (!payload || !sig) return null;

    if (Date.now() > (payload._expiresAt || 0)) {
      return null; // Session expired
    }

    const expectedSig = await hashSha256(JSON.stringify(payload) + SESSION_SECRET);
    if (sig !== expectedSig) {
      return null; // Tamper detected
    }

    const { _expiresAt, _nonce, ...user } = payload;
    return user as User;
  } catch {
    return null;
  }
}
