import { create } from 'zustand';
import { type Player, playerService, type CreatePlayerInput, type UpdatePlayerInput } from '../services/playerService.ts';

interface PlayerState {
  // State
  players: Player[];
  selectedPlayer: Player | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchPlayers: () => Promise<void>;
  fetchPlayerById: (id: number) => Promise<void>;
  createPlayer: (playerData: CreatePlayerInput) => Promise<Player>;
  updatePlayer: (id: number, playerData: UpdatePlayerInput) => Promise<void>;
  deletePlayer: (id: number) => Promise<void>;
  setSelectedPlayer: (player: Player | null) => void;
  clearError: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  // Initial state
  players: [],
  selectedPlayer: null,
  loading: false,
  error: null,

  // Fetch all players
  fetchPlayers: async () => {
    set({ loading: true, error: null });
    try {
      const players = await playerService.getAllPlayers();
      set({ players, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch players',
        loading: false 
      });
    }
  },

  // Fetch a single player by ID
  fetchPlayerById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const player = await playerService.getPlayerById(id);
      set({ selectedPlayer: player, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch player',
        loading: false 
      });
    }
  },

  // Create a new player
  createPlayer: async (playerData: CreatePlayerInput) => {
    set({ loading: true, error: null });
    try {
      const newPlayer = await playerService.createPlayer(playerData);
      // Add to players list
      set((state) => ({
        players: [newPlayer, ...state.players],
        loading: false,
      }));
      return newPlayer;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to create player',
        loading: false 
      });
      throw error;
    }
  },

  // Update a player
  updatePlayer: async (id: number, playerData: UpdatePlayerInput) => {
    set({ loading: true, error: null });
    try {
      const updatedPlayer = await playerService.updatePlayer(id, playerData);
      // Update in players list
      set((state) => ({
        players: state.players.map((p) => (p.id === id ? updatedPlayer : p)),
        selectedPlayer: state.selectedPlayer?.id === id ? updatedPlayer : state.selectedPlayer,
        loading: false,
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to update player',
        loading: false 
      });
      throw error;
    }
  },

  // Delete a player
  deletePlayer: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await playerService.deletePlayer(id);
      // Remove from players list
      set((state) => ({
        players: state.players.filter((p) => p.id !== id),
        selectedPlayer: state.selectedPlayer?.id === id ? null : state.selectedPlayer,
        loading: false,
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete player',
        loading: false 
      });
      throw error;
    }
  },

  // Set selected player
  setSelectedPlayer: (player: Player | null) => {
    set({ selectedPlayer: player });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

