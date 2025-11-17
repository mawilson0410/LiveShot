import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, TargetIcon, TrendingUpIcon, ClockIcon } from 'lucide-react';
import { testService } from '../services/testService';

interface Shot {
  id: number;
  shot_index: number;
  court_location: string;
  made: boolean;
  created_at: string;
}

interface Location {
  id: number;
  location_name: string;
  location_key: string;
  shot_order: number;
  planned_shots: number;
}

interface TestData {
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
    total_shots: number;
  };
  locations: Location[];
}

interface LocationStats {
  location_name: string;
  location_key: string;
  makes: number;
  attempts: number;
  percentage: number;
}

export default function TestPage() {
  const { id } = useParams<{ id: string }>();
  const [testData, setTestData] = useState<TestData | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [test, shotsData] = await Promise.all([
          testService.getTestById(Number(id)),
          testService.getTestShots(Number(id)),
        ]);
        setTestData(test);
        setShots(shotsData);
      } catch (error) {
        console.error('Error loading test data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  // Calculate statistics
  const calculateStats = () => {
    if (!testData || shots.length === 0) return null;

    const overallPercentage = testData.total_attempts > 0
      ? Math.round((testData.total_makes / testData.total_attempts) * 100)
      : 0;

    // Calculate per-location stats
    const locationStatsMap = new Map<string, { makes: number; attempts: number }>();
    
    shots.forEach((shot) => {
      const current = locationStatsMap.get(shot.court_location) || { makes: 0, attempts: 0 };
      current.attempts++;
      if (shot.made) current.makes++;
      locationStatsMap.set(shot.court_location, current);
    });

    const locationStats: LocationStats[] = testData.locations
      .map((location) => {
        const stats = locationStatsMap.get(location.location_key) || { makes: 0, attempts: 0 };
        return {
          location_name: location.location_name,
          location_key: location.location_key,
          makes: stats.makes,
          attempts: stats.attempts,
          percentage: stats.attempts > 0 ? Math.round((stats.makes / stats.attempts) * 100) : 0,
        };
      })
      .sort((a, b) => {
        const locationA = testData.locations.find((l) => l.location_key === a.location_key);
        const locationB = testData.locations.find((l) => l.location_key === b.location_key);
        return (locationA?.shot_order || 0) - (locationB?.shot_order || 0);
      });

    // Calculate best streak
    let currentStreak = 0;
    let bestStreak = 0;
    shots.forEach((shot) => {
      if (shot.made) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    // Calculate worst streak
    let currentMissStreak = 0;
    let worstStreak = 0;
    shots.forEach((shot) => {
      if (!shot.made) {
        currentMissStreak++;
        worstStreak = Math.max(worstStreak, currentMissStreak);
      } else {
        currentMissStreak = 0;
      }
    });

    // Calculate test duration
    const startTime = new Date(testData.started_at);
    const endTime = new Date(testData.completed_at);
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);
    const durationSeconds = Math.floor((durationMs % 60000) / 1000);

    // Find best and worst locations
    const bestLocation = locationStats.reduce((best, current) =>
      current.percentage > best.percentage ? current : best,
      locationStats[0]
    );
    const worstLocation = locationStats.reduce((worst, current) =>
      current.percentage < worst.percentage ? current : worst,
      locationStats[0]
    );

    return {
      overallPercentage,
      locationStats,
      bestStreak,
      worstStreak,
      durationMinutes,
      durationSeconds,
      bestLocation,
      worstLocation,
    };
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-base-content/70">Loading test results...</p>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <p className="text-xl font-semibold mb-4">Test not found</p>
          <Link to="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const stats = calculateStats();
  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <p className="text-xl font-semibold">No shot data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link to="/" className="btn btn-ghost btn-sm mb-4">
            <ArrowLeftIcon className="size-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold mb-2">Test Results</h1>
          <div className="flex items-center gap-4 text-sm text-base-content/70">
            <div className="flex items-center gap-2">
              <ClockIcon className="size-4" />
              <span>{formatDate(testData.completed_at)}</span>
            </div>
          </div>
        </div>

        {/* Player Info Card */}
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Player</h2>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold">{testData.player.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  {testData.player.number && (
                    <span className="badge badge-primary">#{testData.player.number}</span>
                  )}
                  {testData.player.team && (
                    <span className="badge badge-outline">{testData.player.team}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-base-content/70">{testData.test_preset.name}</p>
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-2">
                <TargetIcon className="size-5 text-primary" />
                <h3 className="font-semibold">Overall Accuracy</h3>
              </div>
              <p className="text-4xl font-bold text-primary">{stats.overallPercentage}%</p>
              <p className="text-sm text-base-content/70 mt-2">
                {testData.total_makes} / {testData.total_attempts} shots
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUpIcon className="size-5 text-success" />
                <h3 className="font-semibold">Best Streak</h3>
              </div>
              <p className="text-4xl font-bold text-success">{stats.bestStreak}</p>
              <p className="text-sm text-base-content/70 mt-2">Consecutive makes</p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="size-5 text-info" />
                <h3 className="font-semibold">Duration</h3>
              </div>
              <p className="text-4xl font-bold text-info">
                {stats.durationMinutes}:{stats.durationSeconds.toString().padStart(2, '0')}
              </p>
              <p className="text-sm text-base-content/70 mt-2">Minutes : Seconds</p>
            </div>
          </div>
        </div>

        {/* Per-Location Stats */}
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Accuracy by Location</h2>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Makes</th>
                    <th>Attempts</th>
                    <th>Accuracy</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.locationStats.map((location) => (
                    <tr key={location.location_key}>
                      <td className="font-semibold">{location.location_name}</td>
                      <td>{location.makes}</td>
                      <td>{location.attempts}</td>
                      <td>
                        <span className={`font-bold ${location.percentage >= 70 ? 'text-success' : location.percentage >= 50 ? 'text-warning' : 'text-error'}`}>
                          {location.percentage}%
                        </span>
                      </td>
                      <td>
                        <div className="w-24 bg-base-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              location.percentage >= 70 ? 'bg-success' : location.percentage >= 50 ? 'bg-warning' : 'bg-error'
                            }`}
                            style={{ width: `${location.percentage}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h3 className="font-semibold text-lg mb-4">Best Location</h3>
              <p className="text-2xl font-bold text-success mb-2">{stats.bestLocation.location_name}</p>
              <p className="text-sm text-base-content/70">
                {stats.bestLocation.makes} / {stats.bestLocation.attempts} ({stats.bestLocation.percentage}%)
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h3 className="font-semibold text-lg mb-4">Needs Improvement</h3>
              <p className="text-2xl font-bold text-error mb-2">{stats.worstLocation.location_name}</p>
              <p className="text-sm text-base-content/70">
                {stats.worstLocation.makes} / {stats.worstLocation.attempts} ({stats.worstLocation.percentage}%)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
