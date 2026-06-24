// Single choke-point for every backend call. Attaches the JWT, parses JSON,
// and throws an Error carrying the server's message on failure.
// In production, VITE_API_URL points to the deployed backend (e.g. Railway).
// In local dev the Vite proxy routes /api → localhost:4000, so the fallback works.
const BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const TOKEN_KEY = 'cpt_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) clearToken();
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

export const api = {
  // auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } }),

  // articles
  listArticles: () => request('/articles'),
  getArticle: (id) => request(`/articles/${id}`),
  createArticle: (body) => request('/articles', { method: 'POST', body }),
  batchCreateArticles: (articles) => request('/articles/batch', { method: 'POST', body: { articles } }),
  updateArticle: (id, body) => request(`/articles/${id}`, { method: 'PUT', body }),
  bulkUpdateArticles: (ids, action, value) =>
    request('/articles/bulk', { method: 'PATCH', body: { ids, action, value } }),
  deleteArticle: (id) => request(`/articles/${id}`, { method: 'DELETE' }),
  setStatus: (id, status, note) =>
    request(`/articles/${id}/status`, { method: 'POST', body: { status, note } }),
  setLinks: (id, referenceLinks) =>
    request(`/articles/${id}/links`, { method: 'PUT', body: { referenceLinks } }),
  setTimeTaken: (id, minutes) =>
    request(`/articles/${id}/time-taken`, { method: 'PUT', body: { minutes } }),
  pauseWriting: (id) => request(`/articles/${id}/pause`, { method: 'POST' }),
  resumeWriting: (id) => request(`/articles/${id}/resume`, { method: 'POST' }),
  setWriterNotes: (id, notes) => request(`/articles/${id}/notes`, { method: 'PUT', body: { notes } }),

  // reference data
  listClients: () => request('/clients'),
  getClient: (id) => request(`/clients/${id}`),
  createClient: (body) => request('/clients', { method: 'POST', body }),
  updateClient: (id, body) => request(`/clients/${id}`, { method: 'PUT', body }),
  deleteClient: (id) => request(`/clients/${id}`, { method: 'DELETE' }),
  listWriters: () => request('/users/writers'),
  getWriter: (id) => request(`/users/writers/${id}`),
  createWriter: (body) => request('/users/writers', { method: 'POST', body }),
  updateWriter: (id, body) => request(`/users/writers/${id}`, { method: 'PUT', body }),
  archiveWriter: (id) => request(`/users/writers/${id}`, { method: 'DELETE' }),
  listArchivedWriters: () => request('/users/archived'),
  restoreWriter: (id) => request(`/users/archived/${id}/restore`, { method: 'POST' }),
  deleteArchivedWriter: (id) => request(`/users/archived/${id}`, { method: 'DELETE' }),
  setAvatar: (avatarUrl) => request('/users/me/avatar', { method: 'PUT', body: { avatarUrl } }),
  listTypes: () => request('/article-types'),
  createType: (name) => request('/article-types', { method: 'POST', body: { name } }),
  updateType: (id, name) => request(`/article-types/${id}`, { method: 'PUT', body: { name } }),
  deleteType: (id) => request(`/article-types/${id}`, { method: 'DELETE' }),
  listTemplates: () => request('/templates'),
  createTemplate: (body) => request('/templates', { method: 'POST', body }),
  updateTemplate: (id, body) => request(`/templates/${id}`, { method: 'PUT', body }),
  deleteTemplate: (id) => request(`/templates/${id}`, { method: 'DELETE' }),
  listRecurrences: () => request('/recurrences'),
  createRecurrence: (body) => request('/recurrences', { method: 'POST', body }),
  updateRecurrence: (id, body) => request(`/recurrences/${id}`, { method: 'PUT', body }),
  deleteRecurrence: (id) => request(`/recurrences/${id}`, { method: 'DELETE' }),
  runRecurrence: (id) => request(`/recurrences/${id}/run`, { method: 'POST' }),

  // collaboration (Phase 7)
  listNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'POST' }),
  listComments: (articleId) => request(`/comments/article/${articleId}`),
  createComment: (body) => request('/comments', { method: 'POST', body }),
  updateComment: (id, body) => request(`/comments/${id}`, { method: 'PUT', body: { body } }),
  deleteComment: (id) => request(`/comments/${id}`, { method: 'DELETE' }),
  followArticle: (id) => request(`/follows/article/${id}`, { method: 'POST' }),
  unfollowArticle: (id) => request(`/follows/article/${id}`, { method: 'DELETE' }),
  activityFeed: (params = '') => request(`/activity${params}`),

  // dashboard
  dashboard: () => request('/dashboard'),
  myStats: () => request('/dashboard/me'),
  analytics: () => request('/analytics'),
  searchAll: (q) => request(`/search?q=${encodeURIComponent(q)}`),

  // quote of the day
  quoteOfDay: () => request('/quote/today'),
};
