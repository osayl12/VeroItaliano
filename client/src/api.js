const TOKEN_KEY = 'vi_admin_token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t) => {
  try {
    t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

async function request(method, url, body, isForm = false) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';
  const res = await fetch(url, { method, headers, body: body ? (isForm ? body : JSON.stringify(body)) : undefined });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && url.startsWith('/api/admin')) {
    setToken(null);
    window.dispatchEvent(new Event('admin-logout'));
  }
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// Build multipart body: JSON fields in "data" + optional image file
const form = (data, file) => {
  const fd = new FormData();
  fd.append('data', JSON.stringify(data));
  if (file) fd.append('image', file);
  return fd;
};

export const api = {
  site: () => request('GET', '/api/public/site'),
  login: (username, password) => request('POST', '/api/auth/login', { username, password }),
  me: () => request('GET', '/api/auth/me'),
  changePassword: (currentPassword, newPassword) => request('POST', '/api/auth/change-password', { currentPassword, newPassword }),

  list: (type) => request('GET', `/api/admin/${type}`),
  create: (type, data, file) => request('POST', `/api/admin/${type}`, form(data, file), true),
  update: (type, id, data, file) => request('PUT', `/api/admin/${type}/${id}`, form(data, file), true),
  remove: (type, id) => request('DELETE', `/api/admin/${type}/${id}`),

  getSettings: () => request('GET', '/api/admin/settings'),
  saveSettings: (data) => request('PUT', '/api/admin/settings', data)
};
