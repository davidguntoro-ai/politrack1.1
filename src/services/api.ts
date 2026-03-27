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
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/');
    }
    return Promise.reject(err);
  }
);
