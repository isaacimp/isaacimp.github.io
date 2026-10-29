const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function split(text) {
  const m = text.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  if (!m) return { lines: [], body: text, had: false, eol };
  return { lines: m[1].split(/\r?\n/), body: text.slice(m[0].length), had: true, eol };
}

export function join({ lines, body, had, eol }) {
  if (!had && !lines.length) return body;
  return ['---', ...lines, '---'].join(eol) + eol + body;
}

export function read(lines) {
  if (!lines.length) return {};
  try {
    const y = window.jsyaml;
    const load = y.safeLoad || y.load;
    const v = load(lines.join('\n'), { schema: y.FAILSAFE_SCHEMA });
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

const RESERVED = /^(true|false|yes|no|on|off|null|~|[-+]?[\d._]+(e[-+]?\d+)?|0[xbo][\da-f_]+|\d{4}-\d{1,2}-\d{1,2}.*)$/i;
const PLAIN_BLOCK = /^[\p{L}\p{N}][\p{L}\p{N} .,;!?()/_+=\-\u2013\u2014\u2019'&%]*$/u;
const PLAIN_FLOW = /^[\p{L}\p{N}][\p{L}\p{N} .;!?()/_+=\-\u2013\u2014\u2019'&%]*$/u;
const DATE = /^\d{4}-\d{2}(-\d{2})?$/;

export function scalar(s, inList = false) {
  s = String(s);
  const plain = (inList ? PLAIN_FLOW : PLAIN_BLOCK).test(s) && !/\s$/.test(s) && !RESERVED.test(s) && !/ #/.test(s);
  return plain ? s : JSON.stringify(s);
}

const same = (a, b) => JSON.stringify(a == null ? '' : a) === JSON.stringify(b == null ? '' : b);
export const unchanged = same;

export function setKey(lines, key, value) {
  const out = [...lines];
  const re = new RegExp(`^${esc(key)}\\s*:`);
  const i = out.findIndex(l => re.test(l));
  let j = i;
  if (i >= 0) {
    j = i + 1;
    while (j < out.length && (/^\s+\S/.test(out[j]) || /^-\s/.test(out[j]) || out[j].trim() === '')) j++;
    while (j > i + 1 && out[j - 1].trim() === '') j--;
  }
  const empty = value == null || value === '' || (Array.isArray(value) && value.length === 0);
  if (empty) {
    if (i >= 0) out.splice(i, j - i);
    return out;
  }
  const text = Array.isArray(value) ? `[${value.map(v => scalar(v, true)).join(', ')}]` : (key === 'date' && DATE.test(value) ? value : scalar(value));
  const line = `${key}: ${text}`;
  if (i >= 0) {
    out.splice(i, j - i, line);
  } else {
    let at = out.length;
    while (at > 0 && (out[at - 1].trim() === '' || /^\s*#/.test(out[at - 1]))) at--;
    out.splice(at, 0, line);
  }
  return out;
}
