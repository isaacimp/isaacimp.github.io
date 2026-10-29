import { toB64, fromB64 } from './util.js';

const KEY = 'admin.vault.v1';
const ITER = 600000;
const enc = new TextEncoder(), dec = new TextDecoder();

async function deriveKey(pass, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export function exists() {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}

export async function save(token, pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveKey(pass, salt), enc.encode(token)));
  localStorage.setItem(KEY, JSON.stringify({ v: 1, salt: toB64(salt), iv: toB64(iv), ct: toB64(ct) }));
}

export async function unlock(pass) {
  const v = JSON.parse(localStorage.getItem(KEY));
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(v.iv) }, await deriveKey(pass, fromB64(v.salt)), fromB64(v.ct));
    return dec.decode(pt);
  } catch {
    throw new Error('Wrong passphrase.');
  }
}

export function forget() {
  try { localStorage.removeItem(KEY); } catch { }
}
