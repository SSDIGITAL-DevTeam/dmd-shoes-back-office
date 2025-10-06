export function setCookie(name: string, value: string, opts?: { maxAgeSeconds?: number; path?: string; sameSite?: 'Lax' | 'Strict' | 'None'; secure?: boolean }) {
  if (typeof document === 'undefined') return;
  const encName = encodeURIComponent(name);
  const encVal = encodeURIComponent(value);
  let cookie = `${encName}=${encVal}`;
  cookie += `; Path=${opts?.path || '/'}`;
  cookie += `; SameSite=${opts?.sameSite || 'Lax'}`;
  if (opts?.maxAgeSeconds) cookie += `; Max-Age=${opts.maxAgeSeconds}`;
  if (opts?.secure) cookie += '; Secure';
  document.cookie = cookie;
}

export function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const enc = encodeURIComponent(name);
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const c of cookies) {
    const [k, ...rest] = c.split('=');
    const v = rest.join('=');
    if (k === enc || k === name) return decodeURIComponent(v || '');
  }
  return null;
}

export function deleteCookie(name: string, path: string = '/') {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; Path=${path}; SameSite=Lax`;
}

