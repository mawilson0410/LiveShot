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

// Test Preset type
export interface TestPreset {
  id: number;
  name: string;
  key: string;
  description: string;
  total_shots: number;
  locations: {
    id: number;
    location_name: string;
    location_key: string;
    shot_order: number;
    planned_shots: number;
  }[];
}

// Create Test input type
export interface CreateTestInput {
  player_id: number;
  test_preset_id: number;
}

// TODO refactor these names to be specific to the component name
// Test API Service Functions
export const testService = {
  // Get all tests (returns 20 most recent completed tests for homepage component)
  getAllTests: async (): Promise<Test[]> => {
    const response = await api.get<ApiResponse<Test[]>>('/api/tests');
    return response.data.data;
  },

  // Get all test presets
  getTestPresets: async (): Promise<TestPreset[]> => {
    const response = await api.get<ApiResponse<TestPreset[]>>('/api/test-presets');
    return response.data.data;
  },

  // Create a new test
  createTest: async (testData: CreateTestInput) => {
    const response = await api.post<ApiResponse<any>>('/api/tests', testData);
    return response.data.data;
  },

  // Get a single test by ID (with locations)
  getTestById: async (id: number) => {
    const response = await api.get<ApiResponse<any>>(`/api/tests/${id}`);
    return response.data.data;
  },

  // Record all shots for a test
  recordShots: async (testId: number, shots: Array<{ shot_index: number; court_location: string; made: boolean }>) => {
    const response = await api.post<ApiResponse<any>>(`/api/tests/${testId}/shots`, { shots });
    return response.data.data;
  },

  // Mark test as complete
  completeTest: async (testId: number) => {
    const response = await api.patch<ApiResponse<any>>(`/api/tests/${testId}/complete`);
    return response.data.data;
  },

  // Get all shots for a test
  getTestShots: async (testId: number) => {
    const response = await api.get<ApiResponse<any[]>>(`/api/tests/${testId}/shots`);
    return response.data.data;
  },
};

