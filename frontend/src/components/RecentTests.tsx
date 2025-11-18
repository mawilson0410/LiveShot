import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TargetIcon } from 'lucide-react';
import { testService, type Test } from '../services/testService';

export default function RecentTests() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const data = await testService.getAllTests();
        // Limit to 5 most recent tests
        setTests(data.slice(0, 5));
      } catch (error) {
        console.error('Error fetching tests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  // Format date so it looks good on mobile and desktop, the year was making the text wrap too much
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const timePart = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return { datePart, timePart };
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
    <div className="max-w-7xl mx-auto px-4 pb-8">
      <div className="flex items-center gap-2 mb-6">
        <TargetIcon className="size-6 text-primary" />
        <h2 className="text-2xl font-bold">Recent Tests</h2>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body p-0">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-2 md:gap-4 p-4 border-b border-base-content/10 font-semibold text-sm text-base-content/70">
            <div className="col-span-4 md:col-span-4 text-center">Player</div>
            <div className="col-span-3 md:col-span-3 text-center">Test</div>
            <div className="col-span-2 md:col-span-2 text-center text-xs md:text-sm">Date</div>
            <div className="col-span-3 md:col-span-3 text-center">Result</div>
          </div>

          {/* Test Rows */}
          <div className="divide-y divide-base-content/10">
            {tests.map((test) => {
              const percentage = calculatePercentage(test.total_makes, test.total_attempts);
              const { datePart, timePart } = formatDate(test.completed_at);
              
              return (
                <Link
                  key={test.id}
                  to={`/test/${test.id}`}
                  className="grid grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-base-200 transition-colors"
                >
                  <div className="col-span-4 md:col-span-4 text-center">
                    <div className="font-semibold text-sm md:text-base">{test.player.name}</div>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      {test.player.number && (
                        <span className="badge badge-primary badge-sm">#{test.player.number}</span>
                      )}
                      {test.player.team && (
                        <span className="badge badge-outline badge-sm">{test.player.team}</span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-3 md:col-span-3 text-center text-base-content/70 text-sm md:text-base">
                    {test.test_preset.name}
                  </div>
                  <div className="col-span-2 md:col-span-2 text-center text-xs md:text-sm text-base-content/60">
                    <div className="block md:inline">{datePart}</div>
                    <div className="block md:inline md:ml-1">{timePart}</div>
                  </div>
                  <div className="col-span-3 md:col-span-3 text-center">
                    <div className="font-semibold text-primary text-sm md:text-base">{percentage}%</div>
                    <div className="text-xs md:text-sm text-base-content/70">
                      {test.total_makes} / {test.total_attempts}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

