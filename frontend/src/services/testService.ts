import { api } from '../config/api';

// Type definitions for Test
export interface Test {
  id: number;
  total_makes: number;
  total_attempts: number;
  started_at: string;
  completed_at: string;
  player: {
    id: number;
    name: string;
    team: string | null;
    number: string | null;
  };
  test_preset: {
    id: number;
    name: string;
    key: string;
    description: string;
    total_shots: number;
  };
}

// API Response type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Test API Service Functions
export const testService = {
  // Get all tests (returns 20 most recent completed tests for homepage component)
  getAllTests: async (): Promise<Test[]> => {
    const response = await api.get<ApiResponse<Test[]>>('/api/tests');
    return response.data.data;
  },
};

