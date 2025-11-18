import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, TargetIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
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

type SortOption = 'recent' | 'oldest' | 'highest' | 'lowest';

export default function PlayerTestsPage() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [allTests, setAllTests] = useState<PlayerTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const testsPerPage = 10;

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const [playerData, testsData] = await Promise.all([
          playerService.getPlayerById(Number(id)),
          playerService.getPlayerTests(Number(id)),
        ]);
        setPlayer(playerData);
        setAllTests(testsData);
      } catch (error) {
        console.error('Error loading player tests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

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

  // Sort tests based on selected option
  const sortedTests = [...allTests].sort((a, b) => {
    switch (sortOption) {
      case 'recent':
        return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
      case 'oldest':
        return new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime();
      case 'highest':
        return calculatePercentage(b.total_makes, b.total_attempts) - calculatePercentage(a.total_makes, a.total_attempts);
      case 'lowest':
        return calculatePercentage(a.total_makes, a.total_attempts) - calculatePercentage(b.total_makes, b.total_attempts);
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedTests.length / testsPerPage);
  const startIndex = (currentPage - 1) * testsPerPage;
  const endIndex = startIndex + testsPerPage;
  const paginatedTests = sortedTests.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-base-content/70">Loading tests...</p>
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

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link to={`/player/${id}`} className="btn btn-ghost btn-sm mb-4">
            <ArrowLeftIcon className="size-4 mr-2" />
            Back to Player
          </Link>
        </div>

        {/* Player Info */}
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body">
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
        </div>

        {/* Controls */}
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <TargetIcon className="size-6 text-primary" />
                <h2 className="text-2xl font-bold">All Tests</h2>
                <span className="badge badge-outline">({allTests.length} total)</span>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="label">
                  <span className="label-text mr-2">Sort by:</span>
                </label>
                <select
                  className="select select-bordered select-sm"
                  value={sortOption}
                  onChange={(e) => {
                    setSortOption(e.target.value as SortOption);
                    // Reset to first page when sorting changes
                    setCurrentPage(1);
                  }}
                >
                  <option value="recent">Most Recent</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Accuracy</option>
                  <option value="lowest">Lowest Accuracy</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tests List */}
        {paginatedTests.length === 0 ? (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <p className="text-center text-base-content/60 py-8">
                No tests found
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="card bg-base-100 shadow-md mb-4">
              <div className="card-body p-0">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-2 md:gap-4 p-4 border-b border-base-content/10 font-semibold text-sm text-base-content/70">
                  <div className="col-span-5 md:col-span-5 text-center">Test</div>
                  <div className="col-span-3 md:col-span-3 text-center text-xs md:text-sm">Date</div>
                  <div className="col-span-4 md:col-span-4 text-center">Result</div>
                </div>

                {/* Test Rows */}
                <div className="divide-y divide-base-content/10">
                  {paginatedTests.map((test) => {
                    const percentage = calculatePercentage(test.total_makes, test.total_attempts);
                    const { datePart, timePart } = formatDate(test.completed_at);
                    
                    return (
                      <Link
                        key={test.id}
                        to={`/test/${test.id}`}
                        className="grid grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-base-200 transition-colors"
                      >
                        <div className="col-span-5 md:col-span-5 text-center text-base-content/70 text-sm md:text-base">
                          {test.test_preset.name}
                        </div>
                        <div className="col-span-3 md:col-span-3 text-center text-xs md:text-sm text-base-content/60">
                          <div className="block md:inline">{datePart}</div>
                          <div className="block md:inline md:ml-1">{timePart}</div>
                        </div>
                        <div className="col-span-4 md:col-span-4 text-center">
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

            {/* Pagination so loading tons of tests at once doesn't lag super long */}
            {totalPages > 1 && (
              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-base-content/70">
                      Showing {startIndex + 1}-{Math.min(endIndex, sortedTests.length)} of {sortedTests.length} tests
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="btn btn-ghost btn-sm"
                      >
                        <ChevronLeftIcon className="size-4" />
                      </button>
                      <span className="text-sm font-semibold">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="btn btn-ghost btn-sm"
                      >
                        <ChevronRightIcon className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

