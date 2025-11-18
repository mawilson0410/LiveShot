import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, TargetIcon, TrendingUpIcon, AwardIcon, BarChartIcon, ClockIcon } from 'lucide-react';
import { playerService, type Player } from '../services/playerService';

interface PlayerTest {
  id: number;
  total_makes: number;
  total_attempts: number;
  started_at: string;
  completed_at: string;
  test_preset: {
    id: number;
    name: string;
    key: string;
    description: string;
    total_shots: number;
  };
}

interface PlayerStats {
  total_tests: number;
  total_attempts: number;
  total_makes: number;
  total_points: number;
  avg_accuracy: number;
  best_accuracy: number;
  worst_accuracy: number;
}

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [recentTests, setRecentTests] = useState<PlayerTest[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      // Fetch all data needed for player page
      try {
        const [playerData, testsData, statsData] = await Promise.all([
          playerService.getPlayerById(Number(id)),
          playerService.getPlayerTests(Number(id)),
          playerService.getPlayerStats(Number(id)),
        ]);
        setPlayer(playerData);
        setRecentTests(testsData?.slice(0, 3) || []);
        setStats(statsData);
      } catch (error) {
        console.error('Error loading player data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Calculate percentage of made shots
  const calculatePercentage = (makes: number, attempts: number) => {
    if (attempts === 0) return 0;
    return Math.round((makes / attempts) * 100);
  };

  // Calculate overall accuracy
  const calculateOverallAccuracy = () => {
    if (!stats || stats.total_attempts === 0) return 0;
    return Math.round((stats.total_makes / stats.total_attempts) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-base-content/70">Loading player data...</p>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <p className="text-xl font-semibold mb-4">Player not found</p>
          <Link to="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const overallAccuracy = calculateOverallAccuracy();

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link to="/" className="btn btn-ghost btn-sm mb-4">
            <ArrowLeftIcon className="size-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Top Section - Player Info and Recent Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Player Info Card */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <div className="mb-4">
                <h1 className="text-3xl font-bold mb-2">{player.name}</h1>
                <div className="flex items-center gap-2">
                  {player.number && (
                    <span className="badge badge-primary badge-lg">#{player.number}</span>
                  )}
                  {player.team && (
                    <span className="badge badge-outline badge-lg">{player.team}</span>
                  )}
                </div>
              </div>
              {stats && (
                <div className="pt-4 border-t border-base-content/10">
                  <div className="flex items-center gap-2 mb-2">
                    <TargetIcon className="size-5 text-primary" />
                    <span className="font-semibold">Overall Accuracy</span>
                  </div>
                  <p className="text-3xl font-bold text-primary">{overallAccuracy}%</p>
                  <p className="text-sm text-base-content/70 mt-1">
                    {stats.total_makes} / {stats.total_attempts} shots
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Tests */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">Recent Tests</h2>
            {recentTests.length === 0 ? (
              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <p className="text-center text-base-content/60 py-4">
                    No completed tests yet
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {recentTests.map((test) => {
                  const percentage = calculatePercentage(test.total_makes, test.total_attempts);
                  return (
                    <Link
                      key={test.id}
                      to={`/test/${test.id}`}
                      className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow border border-base-content/10"
                    >
                      <div className="card-body">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{test.test_preset.name}</h3>
                            <div className="flex items-center gap-4 text-xs text-base-content/60">
                              <div className="flex items-center gap-1">
                                <ClockIcon className="size-3" />
                                <span>{formatDate(test.completed_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary mb-1">
                              {percentage}%
                            </div>
                            <div className="text-sm text-base-content/70">
                              {test.total_makes} / {test.total_attempts}
                            </div>
                            <div className="progress progress-primary w-24 mt-2" style={{ height: '6px' }}>
                              <div
                                className="progress-bar"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        {stats && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Lifetime Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChartIcon className="size-5 text-info" />
                    <h3 className="font-semibold">Total Tests</h3>
                  </div>
                  <p className="text-3xl font-bold text-info">{stats.total_tests}</p>
                  <p className="text-sm text-base-content/70 mt-1">
                    completed
                  </p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <div className="flex items-center gap-2 mb-2">
                    <TargetIcon className="size-5 text-primary" />
                    <h3 className="font-semibold">Total Shots</h3>
                  </div>
                  <p className="text-3xl font-bold text-primary">{stats.total_attempts}</p>
                  <p className="text-sm text-base-content/70 mt-1">
                    {stats.total_makes} made
                  </p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <div className="flex items-center gap-2 mb-2">
                    <AwardIcon className="size-5 text-warning" />
                    <h3 className="font-semibold">Total Points</h3>
                  </div>
                  <p className="text-3xl font-bold text-warning">{stats.total_points || 0}</p>
                  <p className="text-sm text-base-content/70 mt-1">
                    from made shots
                  </p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUpIcon className="size-5 text-success" />
                    <h3 className="font-semibold">Avg Accuracy</h3>
                  </div>
                  <p className="text-3xl font-bold text-success">
                    {Math.round(stats.avg_accuracy || 0)}%
                  </p>
                  <p className="text-sm text-base-content/70 mt-1">
                    per test
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <h3 className="font-semibold text-lg mb-2">Best Test</h3>
                  <p className="text-2xl font-bold text-success">
                    {Math.round(stats.best_accuracy || 0)}%
                  </p>
                  <p className="text-sm text-base-content/70 mt-1">Highest accuracy in a single test</p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <h3 className="font-semibold text-lg mb-2">Worst Test</h3>
                  <p className="text-2xl font-bold text-error">
                    {Math.round(stats.worst_accuracy || 0)}%
                  </p>
                  <p className="text-sm text-base-content/70 mt-1">Lowest accuracy in a single test</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
