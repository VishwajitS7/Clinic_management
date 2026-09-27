import api from './api';

export const dashboardService = {
  getStats: async () => {
    return api.get('/dashboard/stats');
  },
};

export default dashboardService;
