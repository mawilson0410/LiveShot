import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, TargetIcon, TrendingUpIcon, AwardIcon, BarChartIcon, ClockIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { playerService, type Player } from '../services/playerService';

interface PlayerTest {
  id: number;
  total_makes: number;
  total_attempts: number;
  total_points: number;
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
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [allTests, setAllTests] = useState<PlayerTest[]>([]);
  const [recentTests, setRecentTests] = useState<PlayerTest[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  // State for the points over time chart, so user can switch between types of tests
  const [selectedTestPresetKey, setSelectedTestPresetKey] = useState<string | null>(null);

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
        setAllTests(testsData || []);
        setRecentTests(testsData?.slice(0, 3) || []);
        setStats(statsData);
        
        // Set default test preset to the one with the most tests FOR ONLY THE POINT OVER TIME CHART
        if (testsData && testsData.length > 0) {
          const testPresetCounts = new Map<string, number>();
          testsData.forEach((test: PlayerTest) => {
            const key = test.test_preset.key;
            testPresetCounts.set(key, (testPresetCounts.get(key) || 0) + 1);
          });
          
          let maxCount = 0;
          let mostCommonKey = testsData[0].test_preset.key;
          testPresetCounts.forEach((count, key) => {
            if (count > maxCount) {
              maxCount = count;
              mostCommonKey = key;
            }
          });
          
          setSelectedTestPresetKey(mostCommonKey);
        }
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

  // Get unique test presets for navigation
  const testPresets = Array.from(
    new Map(allTests.map(test => [test.test_preset.key, test.test_preset])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Get current test preset index
  const currentPresetIndex = selectedTestPresetKey 
    ? testPresets.findIndex(p => p.key === selectedTestPresetKey)
    : -1;

  // Navigation functions
  const navigateToPreviousPreset = () => {
    if (currentPresetIndex > 0) {
      setSelectedTestPresetKey(testPresets[currentPresetIndex - 1].key);
    } else if (testPresets.length > 0) {
      setSelectedTestPresetKey(testPresets[testPresets.length - 1].key);
    }
  };

  const navigateToNextPreset = () => {
    if (currentPresetIndex < testPresets.length - 1) {
      setSelectedTestPresetKey(testPresets[currentPresetIndex + 1].key);
    } else if (testPresets.length > 0) {
      setSelectedTestPresetKey(testPresets[0].key);
    }
  };

  // Filter tests by selected preset for points chart
  const filteredTestsForPoints = selectedTestPresetKey
    ? allTests.filter(test => test.test_preset.key === selectedTestPresetKey)
    : [];

  // Chart data creation
  const chartTests = allTests.slice(0, 20).sort((a, b) => 
    new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
  );

  const accuracyChartData = chartTests.map((test) => ({
    date: new Date(test.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    accuracy: Math.round((test.total_makes / test.total_attempts) * 100),
    testId: test.id,
    testName: test.test_preset.name,
  }));

  // Points over time chart data filtered by selected test preset, sorted by date
  const pointsChartData = filteredTestsForPoints
    .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())
    .map((test) => ({
      date: new Date(test.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      points: test.total_points || 0,
      testId: test.id,
      testName: test.test_preset.name,
    }));

  // Get current test preset name
  const currentPresetName = testPresets.find(p => p.key === selectedTestPresetKey)?.name || 'No tests available';

  const handleChartClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.testId) {
      navigate(`/test/${data.activePayload[0].payload.testId}`);
    }
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

          {/* Recent Tests and button to view all tests (player test page) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Tests</h2>
              {recentTests.length > 0 && (
                <Link
                  to={`/player/${id}/tests`}
                  className="btn btn-ghost btn-sm"
                >
                  View all tests
                </Link>
              )}
            </div>
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

        {/* Charts Section */}
        {allTests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Performance Trends</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Accuracy Over Time Chart */}
              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <h3 className="card-title text-lg mb-4">Accuracy Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={accuracyChartData}
                      onClick={handleChartClick}
                      style={{ cursor: 'pointer' }}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--bc) / 0.1)" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--bc) / 0.8)"
                        tick={{ fill: 'hsl(var(--bc) / 0.8)', fontSize: 14, fontWeight: 500 }}
                        style={{ fontSize: '14px', fontWeight: '500' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--bc) / 0.8)"
                        tick={{ fill: 'hsl(var(--bc) / 0.8)', fontSize: 14, fontWeight: 500 }}
                        style={{ fontSize: '14px', fontWeight: '500' }}
                        label={{ 
                          value: 'Accuracy %', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle', fill: 'hsl(var(--bc) / 0.9)', fontSize: '14px', fontWeight: '600' }
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--b1))',
                          border: '1px solid hsl(var(--bc) / 0.2)',
                          borderRadius: '8px',
                        }}
                        formatter={(value: any) => [`${value}% Accuracy`]}
                        labelFormatter={(label: string, payload: any[]) => {
                          if (payload && payload[0]) {
                            return payload[0].payload.testName;
                          }
                          return label;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#8884d8"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#8884d8', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7, strokeWidth: 2 }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Points Over Time Chart */}
              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="card-title text-lg">Points Over Time</h3>
                    {testPresets.length > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={navigateToPreviousPreset}
                          className="btn btn-ghost btn-sm btn-circle"
                          aria-label="Previous test type"
                        >
                          <ChevronLeftIcon className="size-5" />
                        </button>
                        <span className="text-sm font-medium text-base-content/80 min-w-[120px] text-center">
                          {currentPresetName}
                        </span>
                        <button
                          onClick={navigateToNextPreset}
                          className="btn btn-ghost btn-sm btn-circle"
                          aria-label="Next test type"
                        >
                          <ChevronRightIcon className="size-5" />
                        </button>
                      </div>
                    )}
                    {testPresets.length === 1 && (
                      <span className="text-sm font-medium text-base-content/60">
                        {currentPresetName}
                      </span>
                    )}
                  </div>
                  {pointsChartData.length === 0 ? (
                    <div className="flex items-center justify-center h-[300px] text-base-content/60">
                      <p>No tests available for this test type</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={pointsChartData}
                      onClick={handleChartClick}
                      style={{ cursor: 'pointer' }}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--bc) / 0.1)" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--bc) / 0.8)"
                        tick={{ fill: 'hsl(var(--bc) / 0.8)', fontSize: 14, fontWeight: 500 }}
                        style={{ fontSize: '14px', fontWeight: '500' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--bc) / 0.8)"
                        tick={{ fill: 'hsl(var(--bc) / 0.8)', fontSize: 14, fontWeight: 500 }}
                        style={{ fontSize: '14px', fontWeight: '500' }}
                        label={{ 
                          value: 'Points', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle', fill: 'hsl(var(--bc) / 0.9)', fontSize: '14px', fontWeight: '600' }
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--b1))',
                          border: '1px solid hsl(var(--bc) / 0.2)',
                          borderRadius: '8px',
                        }}
                        formatter={(value: any) => [`${value} points`]}
                        labelFormatter={(label: string, payload: any[]) => {
                          if (payload && payload[0]) {
                            return payload[0].payload.testName;
                          }
                          return label;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="points"
                        stroke="#82ca9d"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#82ca9d', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7, strokeWidth: 2 }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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
