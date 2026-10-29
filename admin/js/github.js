import { b64ToText, textToB64 } from './util.js';

const ROOT = 'https://api.github.com';

export class ApiError extends Error {
  constructor(status, message, data) { super(message); this.status = status; this.data = data; }
}

const enc = p => p.split('/').map(encodeURIComponent).join('/');

function explain(status, data) {
  const msg = (data && data.message) || '';
  if (status === 401) return 'GitHub rejected the token. It may have expired.';
  if (status === 404) return 'Not found, or the token can\'t see this repo.';
  if ((status === 409 || status === 422) && /sha|does not match/i.test(msg)) return 'This file changed on GitHub since you opened it. Reload and redo your edit.';
  if (status === 403 && /rate limit/i.test(msg)) return 'GitHub rate limit. Try again in a bit.';
  if (status === 403) return `GitHub refused it. The token needs Contents read and write.`;
  return msg || `GitHub error ${status}`;
}

export function createClient({ repo, branch, token }) {
  async function api(method, path, body) {
    let res;
    try {
      res = await fetch(ROOT + path, {
        method,
        cache: 'no-store',
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          Authorization: `Bearer ${token}`,
          ...(body ? { 'Content-Type': 'application/json' } : {})
        },
        body: body ? JSON.stringify(body) : undefined
      });
    } catch {
      throw new ApiError(0, 'Could not reach GitHub. Are you offline?');
    }
    let data = null;
    try { data = await res.json(); } catch { }
    if (!res.ok) throw new ApiError(res.status, explain(res.status, data), data);
    return data;
  }

  const base = p => `/repos/${repo}/contents/${enc(p)}`;

  return {
    repo, branch,
    repoInfo: () => api('GET', `/repos/${repo}`),

    async list(dir) {
      try {
        const r = await api('GET', `${base(dir)}?ref=${encodeURIComponent(branch)}`);
        return Array.isArray(r) ? r : [];
      } catch (e) {
        if (e.status === 404) return [];
        throw e;
      }
    },

    async read(path) {
      const r = await api('GET', `${base(path)}?ref=${encodeURIComponent(branch)}`);
      if (Array.isArray(r) || r.type !== 'file') throw new ApiError(0, `${path} is not a file.`);
      if (r.encoding !== 'base64') throw new ApiError(0, `${path} is too large to edit here.`);
      return { text: b64ToText(r.content), sha: r.sha, path };
    },

    async write(path, content, message, sha) {
      const r = await api('PUT', base(path), {
        message, branch,
        content: content.base64 != null ? content.base64 : textToB64(content.text),
        ...(sha ? { sha } : {})
      });
      return { sha: r.content.sha, commit: r.commit.sha };
    },

    async remove(path, sha, message) {
      await api('DELETE', base(path), { message, sha, branch });
    }
  };
}
