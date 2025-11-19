import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrophyIcon } from 'lucide-react';
import { playerService } from '../services/playerService';

interface LeaderboardPlayer {
  id: number;
  name: string;
  team: string | null;
  number: string | null;
  total_tests: number;
  total_points: number;
  avg_accuracy: number;
}

export default function Leaderboard() {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await playerService.getLeaderboard();
        setPlayers(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-base-content/60">
          <div className="loading loading-spinner loading-sm"></div>
          <span>Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <TrophyIcon className="size-6 text-warning" />
          <h2 className="text-2xl font-bold">Leaderboard</h2>
        </div>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <p className="text-base-content/60 text-center py-4">
              No players with completed tests yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <TrophyIcon className="size-6 text-warning" />
        <h2 className="text-2xl font-bold">Leaderboard</h2>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body p-0">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-base-content/10 font-semibold text-sm text-base-content/70">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-4 text-center">Player</div>
            <div className="col-span-2 text-center">Avg. Acc.</div>
            <div className="col-span-2 text-center">Lifetime Pts.</div>
            {/* Test label and data align to the right to give a little more room for the points */}
            <div className="col-span-2 text-right">Tests</div>
            <div className="col-span-1"></div>
          </div>

          {/* Player Rows */}
          <div className="divide-y divide-base-content/10">
            {players.map((player, index) => (
              <Link
                key={player.id}
                to={`/player/${player.id}`}
                className="grid grid-cols-12 gap-4 p-4 hover:bg-base-200 transition-colors"
              >
                <div className="col-span-1 flex items-center justify-center">
                  <span className="text-lg font-bold text-warning">#{index + 1}</span>
                </div>
                <div className="col-span-4 text-center">
                  <span className="font-semibold hover:text-primary transition-colors">
                    {player.name}
                  </span>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    {player.number && (
                      <span className="badge badge-primary badge-sm">#{player.number}</span>
                    )}
                    {player.team && (
                      <span className="badge badge-outline badge-sm">{player.team}</span>
                    )}
                  </div>
                </div>
                <div className="col-span-2 text-center font-semibold">
                  {Math.round(player.avg_accuracy || 0)}%
                </div>
                <div className="col-span-2 text-center font-semibold">
                  {player.total_points || 0}
                </div>
                <div className="col-span-2 text-right font-semibold">
                  {player.total_tests}
                </div>
                <div className="col-span-1"></div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

