import api from '@/lib/api';
import { normalizeError } from '@/lib/api-error';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import type { ApiResponse, AdminStudent, AdminDashboardStats } from '@/types';

export interface CreateStudentPayload {
  name: string;
  email: string;
  temporaryPassword: string;
}

export interface UpdateStudentPayload {
  name: string;
  email: string;
}

export interface CreateStudentResult {
  id: string;
  name: string;
  email: string;
  isFirstLogin: boolean;
  isActive: boolean;
  createdAt: string;
}

export const adminStudentService = {
  async getOne(id: string): Promise<AdminStudent> {
    try {
      const { data } = await api.get<ApiResponse<{ student: AdminStudent }>>(
        API_ENDPOINTS.admin.students.get(id)
      );
      return (data.data as { student: AdminStudent }).student;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async list(search?: string): Promise<{ students: AdminStudent[]; total: number }> {
    try {
      const { data } = await api.get<ApiResponse<{ students: AdminStudent[]; total: number }>>(
        API_ENDPOINTS.admin.students.list,
        { params: search ? { search } : undefined }
      );
      return data.data as { students: AdminStudent[]; total: number };
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async create(payload: CreateStudentPayload): Promise<CreateStudentResult> {
    try {
      const { data } = await api.post<ApiResponse<CreateStudentResult>>(
        API_ENDPOINTS.admin.students.create,
        payload
      );
      return data.data as CreateStudentResult;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async update(id: string, payload: UpdateStudentPayload): Promise<AdminStudent> {
    try {
      const { data } = await api.put<ApiResponse<{ student: AdminStudent }>>(
        API_ENDPOINTS.admin.students.update(id),
        payload
      );
      return (data.data as { student: AdminStudent }).student;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async resetPassword(id: string, temporaryPassword: string): Promise<{ message?: string }> {
    try {
      const { data } = await api.patch<ApiResponse>(API_ENDPOINTS.admin.students.resetPassword(id), {
        newTemporaryPassword: temporaryPassword,
      });
      return { message: data.message };
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async toggleStatus(id: string, isActive: boolean): Promise<{ message?: string }> {
    try {
      const { data } = await api.patch<ApiResponse>(API_ENDPOINTS.admin.students.status(id), {
        isActive,
      });
      return { message: data.message };
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async remove(id: string): Promise<{ message?: string }> {
    try {
      const { data } = await api.delete<ApiResponse>(API_ENDPOINTS.admin.students.delete(id));
      return { message: data.message };
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getDashboardStats(): Promise<AdminDashboardStats> {
    try {
      const { data } = await api.get<ApiResponse<AdminDashboardStats>>(API_ENDPOINTS.admin.dashboardStats);
      return data.data as AdminDashboardStats;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
