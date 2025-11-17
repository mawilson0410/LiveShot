import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClockIcon, TargetIcon } from 'lucide-react';
import { testService, type Test } from '../services/testService';

export default function RecentTests() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const data = await testService.getAllTests();
        setTests(data);
      } catch (error) {
        console.error('Error fetching tests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

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

  const calculatePercentage = (makes: number, attempts: number) => {
    if (attempts === 0) return 0;
    return Math.round((makes / attempts) * 100);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-base-content/60">
          <div className="loading loading-spinner loading-sm"></div>
          <span>Loading recent tests...</span>
        </div>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">Recent Tests</h2>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <p className="text-base-content/60 text-center py-8">
              No completed tests yet. Start tracking shots to see results here!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <TargetIcon className="size-6 text-primary" />
        <h2 className="text-2xl font-bold">Recent Tests</h2>
      </div>

      <div className="grid gap-4">
        {tests.map((test) => {
          const percentage = calculatePercentage(test.total_makes, test.total_attempts);
          
          return (
            <Link
              key={test.id}
              to={`/test/${test.id}`}
              className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow border border-base-content/10"
            >
              <div className="card-body">
                <div className="flex items-start justify-between gap-4">
                  {/* LEFT SECTION - Player & Test Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{test.player.name}</h3>
                      {test.player.number && (
                        <span className="badge badge-primary badge-sm">#{test.player.number}</span>
                      )}
                      {test.player.team && (
                        <span className="badge badge-outline badge-sm">{test.player.team}</span>
                      )}
                    </div>
                    
                    <p className="text-sm text-base-content/70 mb-3">
                      {test.test_preset.name}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-base-content/60">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="size-3" />
                        <span>{formatDate(test.completed_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SECTION - Stats */}
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
    </div>
  );
}

