import { api } from '../config/api';

// Type definitions for Player
export interface Player {
  id: number;
  name: string;
  team: string | null;
  number: string | null;
  created_at: string;
}

// API Response type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Create Player input type
export interface CreatePlayerInput {
  name: string;
  team?: string;
  number?: string;
}

// Update Player input type
export interface UpdatePlayerInput {
  name?: string;
  team?: string;
  number?: string;
}

// Player API Service Functions
export const playerService = {
  // Get all players
  getAllPlayers: async (): Promise<Player[]> => {
    const response = await api.get<ApiResponse<Player[]>>('/api/players');
    return response.data.data;
  },

  // Get a single player by ID
  getPlayerById: async (id: number): Promise<Player> => {
    const response = await api.get<ApiResponse<Player>>(`/api/players/${id}`);
    return response.data.data;
  },

  // Create a new player
  createPlayer: async (playerData: CreatePlayerInput): Promise<Player> => {
    const response = await api.post<ApiResponse<Player>>('/api/players', playerData);
    return response.data.data;
  },

  // Update a player
  updatePlayer: async (id: number, playerData: UpdatePlayerInput): Promise<Player> => {
    const response = await api.put<ApiResponse<Player>>(`/api/players/${id}`, playerData);
    return response.data.data;
  },

  // Delete a player
  deletePlayer: async (id: number): Promise<Player> => {
    const response = await api.delete<ApiResponse<Player>>(`/api/players/${id}`);
    return response.data.data;
  },

  // Get all tests for a player
  getPlayerTests: async (id: number) => {
    const response = await api.get<ApiResponse<any[]>>(`/api/players/${id}/tests`);
    return response.data.data;
  },

  // Get player stats
  getPlayerStats: async (id: number) => {
    const response = await api.get<ApiResponse<any>>(`/api/players/${id}/stats`);
    return response.data.data;
  },

  // Get leaderboard (top 5 players)
  getLeaderboard: async () => {
    const response = await api.get<ApiResponse<any[]>>('/api/players/leaderboard');
    return response.data.data;
  },
};

