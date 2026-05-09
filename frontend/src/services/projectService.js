import api from './api';

export const projectService = {
  getAll: (params = {}) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, userId, role) => api.post(`/projects/${id}/members`, { userId, role }),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
};
