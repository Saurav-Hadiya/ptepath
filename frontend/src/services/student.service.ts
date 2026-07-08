import api from '@/lib/api';
import { normalizeError } from '@/lib/api-error';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import type { ApiResponse, DashboardStats } from '@/types';

export const studentService = {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const { data } = await api.get<ApiResponse<DashboardStats>>(API_ENDPOINTS.student.dashboardStats);
      return data.data as DashboardStats;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
