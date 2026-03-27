import axios from 'axios';

export const api = axios.create({ baseURL: '/' });

api.interceptors.request.use(config => {
  const token    = localStorage.getItem('politrack_token') || localStorage.getItem('token') || '';
  const tenantId = localStorage.getItem('tenantId') || 'tenant_1';
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  config.headers['x-tenant-id'] = tenantId;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const data = err.response?.data || {};
      const msg: string = (data.error || data.message || '').toLowerCase();
      const isExpired =
        msg.includes('expired') ||
        msg.includes('token expired') ||
        data.code === 'TOKEN_EXPIRED';
      if (isExpired) {
        localStorage.removeItem('politrack_token');
        localStorage.removeItem('politrack_user');
        window.location.replace('/');
      }
    }
    return Promise.reject(err);
  }
);
