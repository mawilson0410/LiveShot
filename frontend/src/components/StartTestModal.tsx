import { useState } from 'react';
import { XIcon } from 'lucide-react';
import { playerService, type Player, type CreatePlayerInput } from '../services/playerService';
import { testService, type TestPreset } from '../services/testService';

interface StartTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTest: (testId: number) => void;
}

export default function StartTestModal({ isOpen, onClose, onStartTest }: StartTestModalProps) {
  const [step, setStep] = useState<'player' | 'preset'>('player');
  const [playerOption, setPlayerOption] = useState<'new' | 'existing'>('new');
  
  // New player form
  const [newPlayer, setNewPlayer] = useState<CreatePlayerInput>({
    name: '',
    team: '',
    number: '',
  });

  // Existing player selection
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Test preset selection
  const [presets, setPresets] = useState<TestPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);

  // Load players when switching to existing player option
  const handlePlayerOptionChange = async (option: 'new' | 'existing') => {
    setPlayerOption(option);
    if (option === 'existing' && players.length === 0) {
      try {
        const data = await playerService.getAllPlayers();
        setPlayers(data);
      } catch (error) {
        console.error('Error loading players:', error);
      }
    }
  };

  // Load presets when moving to preset step
  const handleNextToPreset = async () => {
    if (playerOption === 'new' && !newPlayer.name.trim()) {
      return;
    }
    if (playerOption === 'existing' && !selectedPlayerId) {
      return;
    }

    if (presets.length === 0) {
      try {
        setLoading(true);
        const data = await testService.getTestPresets();
        console.log('Loaded presets:', data);
        setPresets(data);
      } catch (error) {
        console.error('Error loading presets:', error);
      } finally {
        setLoading(false);
      }
    }
    setStep('preset');
  };

  // Handle starting the test
  const handleStartTest = async () => {
    if (!selectedPresetId) return;

    try {
      setLoading(true);
      let playerId: number;

      if (playerOption === 'new') {
        const createdPlayer = await playerService.createPlayer(newPlayer);
        playerId = createdPlayer.id;
      } else {
        playerId = selectedPlayerId!;
      }

      const test = await testService.createTest({
        player_id: playerId,
        test_preset_id: selectedPresetId,
      });

      onStartTest(test.id);
      handleClose();
    } catch (error) {
      console.error('Error starting test:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset and close modal
  const handleClose = () => {
    setStep('player');
    setPlayerOption('new');
    setNewPlayer({ name: '', team: '', number: '' });
    setSelectedPlayerId(null);
    setSearchTerm('');
    setSelectedPresetId(null);
    onClose();
  };

  // Filter players by search term
  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (player.team && player.team.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (player.number && player.number.includes(searchTerm))
  );

  const selectedPreset = presets.find((p) => Number(p.id) === Number(selectedPresetId));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-base-content/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-content/10">
          <h2 className="text-2xl font-bold">Start New Test</h2>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {step === 'player' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Player</h3>
                
                {/* Player Option Tabs */}
                <div className="tabs tabs-boxed mb-4">
                  <button
                    className={`tab ${playerOption === 'new' ? 'tab-active' : ''}`}
                    onClick={() => handlePlayerOptionChange('new')}
                  >
                    New Player
                  </button>
                  <button
                    className={`tab ${playerOption === 'existing' ? 'tab-active' : ''}`}
                    onClick={() => handlePlayerOptionChange('existing')}
                  >
                    Existing Player
                  </button>
                </div>

                {/* New Player Form */}
                {playerOption === 'new' && (
                  <div className="space-y-4">
                    <div>
                      <label className="label">
                        <span className="label-text">Name *</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={newPlayer.name}
                        onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                        placeholder="Enter player name"
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text">Team</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={newPlayer.team || ''}
                        onChange={(e) => setNewPlayer({ ...newPlayer, team: e.target.value })}
                        placeholder="Enter team name (optional)"
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text">Number</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={newPlayer.number || ''}
                        onChange={(e) => setNewPlayer({ ...newPlayer, number: e.target.value })}
                        placeholder="Enter jersey number (optional)"
                      />
                    </div>
                  </div>
                )}

                {/* Existing Player Search */}
                {playerOption === 'existing' && (
                  <div className="space-y-4">
                    <div>
                      <label className="label">
                        <span className="label-text">Search Players</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, team, or number"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {filteredPlayers.length === 0 ? (
                        <p className="text-center text-base-content/60 py-4">
                          No players found
                        </p>
                      ) : (
                        filteredPlayers.map((player) => (
                          <button
                            key={player.id}
                            onClick={() => setSelectedPlayerId(player.id)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              selectedPlayerId === player.id
                                ? 'border-primary bg-primary/10'
                                : 'border-base-content/10 hover:bg-base-200'
                            }`}
                          >
                            <div className="font-semibold">{player.name}</div>
                            <div className="text-sm text-base-content/70">
                              {player.team && `Team: ${player.team}`}
                              {player.number && ` | #${player.number}`}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'preset' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Test Preset</h3>
                
                <div className="mb-4">
                  <label className="label">
                    <span className="label-text">Test Preset</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={selectedPresetId || ''}
                    onChange={(e) => setSelectedPresetId(Number(e.target.value) || null)}
                  >
                    <option value="">Select a test preset...</option>
                    {presets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPreset ? (
                  <div className="card bg-base-200 border border-base-content/10">
                    <div className="card-body p-4">
                      <h4 className="font-semibold mb-2 text-base">Description</h4>
                      <p className="text-sm text-base-content/80 leading-relaxed">
                        {selectedPreset.description || 'No description available'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="card bg-base-200/50 border border-base-content/10 border-dashed">
                    <div className="card-body p-4">
                      <p className="text-sm text-base-content/60 text-center">
                        Select a test preset to view more details!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-base-content/10">
          <button
            onClick={step === 'preset' ? () => setStep('player') : handleClose}
            className="btn btn-ghost"
          >
            {step === 'preset' ? 'Back' : 'Cancel'}
          </button>
          <button
            onClick={step === 'player' ? handleNextToPreset : handleStartTest}
            className="btn btn-primary"
            disabled={
              loading ||
              (step === 'player' &&
                ((playerOption === 'new' && !newPlayer.name.trim()) ||
                  (playerOption === 'existing' && !selectedPlayerId))) ||
              (step === 'preset' && !selectedPresetId)
            }
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : step === 'player' ? (
              'Next'
            ) : (
              'Begin Test'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

