import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { testService } from '../services/testService';

interface Location {
  id: number;
  location_name: string;
  location_key: string;
  shot_order: number;
  planned_shots: number;
}

interface TestData {
  id: number;
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

interface RecordedShot {
  shot_index: number;
  court_location: string;
  made: boolean;
}

export default function ActiveTestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [testData, setTestData] = useState<TestData | null>(null);
  const [currentShot, setCurrentShot] = useState(1);
  const [recordedShots, setRecordedShots] = useState<RecordedShot[]>([]);
  const [testStatus, setTestStatus] = useState<'loading' | 'countdown' | 'active' | 'completing'>('loading');
  const countdownStartedRef = useRef(false);

  // Calculate current location info
  const getCurrentLocationInfo = () => {
    if (!testData || !testData.locations || testData.locations.length === 0) {
      return null;
    }

    let cumulativeShots = 0;
    for (let i = 0; i < testData.locations.length; i++) {
      const location = testData.locations[i];
      if (currentShot <= cumulativeShots + location.planned_shots) {
        return {
          location,
          shotInLocation: currentShot - cumulativeShots,
        };
      }
      cumulativeShots += location.planned_shots;
    }
    return null;
  };

  const locationInfo = getCurrentLocationInfo();
  const totalShots = testData?.test_preset.total_shots || 0;

  // Load test data on mount
  useEffect(() => {
    const loadTest = async () => {
      try {
        const data = await testService.getTestById(Number(id));
        setTestData(data);
        setTestStatus('countdown');
      } catch (error) {
        console.error('Error loading test:', error);
        toast.error('Failed to load test');
        navigate('/');
      }
    };

    if (id) {
      loadTest();
    }
  }, [id, navigate]);

  // Countdown sequence
  useEffect(() => {
    if (testStatus === 'countdown' && testData && !countdownStartedRef.current) {
      countdownStartedRef.current = true;
      const countdown = async () => {
        toast('3', { duration: 1000, icon: '🏀', id: 'countdown-3' });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast('2', { duration: 1000, icon: '🏀', id: 'countdown-2' });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast('1', { duration: 1000, icon: '🏀', id: 'countdown-1' });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast('Begin!', { duration: 1000, icon: '🏀', id: 'countdown-begin' });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setTestStatus('active');
      };
      countdown();
    }
  }, [testStatus, testData]);

  // Handle shot recording
  const handleShot = async (made: boolean) => {
    if (testStatus !== 'active' || !locationInfo) return;

    const shot: RecordedShot = {
      shot_index: currentShot,
      court_location: locationInfo.location.location_key,
      made,
    };

    const updatedShots = [...recordedShots, shot];
    setRecordedShots(updatedShots);

    // Check if test is complete
    if (currentShot >= totalShots) {
      setTestStatus('completing');
      await completeTest(updatedShots);
    } else {
      setCurrentShot((prev) => prev + 1);
    }
  };

  // Complete test and save all shots
  const completeTest = async (shotsToSave: RecordedShot[]) => {
    try {
      // Save all shots
      await testService.recordShots(Number(id), shotsToSave);
      
      // Mark test as complete
      await testService.completeTest(Number(id));

      toast.success('Test completed!');
      
      // Navigate to test summary page
      navigate(`/test/${id}`);
    } catch (error) {
      console.error('Error completing test:', error);
      toast.error('Failed to save test results', { id: 'test-completion-error' });
      setTestStatus('active');
    }
  };

  // Prevent navigation away during active test
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (testStatus === 'active') {
        e.preventDefault();
        // TODO Find an alternative to this to prevnt user from adding tons of unfinished tests
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [testStatus]);

  if (testStatus === 'loading' || !testData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-base-content/70">Loading test...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      {/* Top Section - Trackers */}
      <div className="bg-base-100 border-b border-base-content/10 p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Location Tracker */}
          {locationInfo && (
            <div className="text-center">
              <p className="text-sm text-base-content/70 mb-1">Current Location</p>
              <p className="text-2xl font-bold">
                Shot {locationInfo.shotInLocation} / {locationInfo.location.planned_shots} for {locationInfo.location.location_name}
              </p>
            </div>
          )}

          {/* Overall Tracker */}
          <div className="text-center">
            <p className="text-sm text-base-content/70 mb-1">Overall Progress</p>
            <p className="text-2xl font-bold">
              Shot {currentShot} / {totalShots}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-base-200 rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${(currentShot / totalShots) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Middle Section - Location Label */}
      <div className="flex-1 flex items-center justify-center p-6">
        {locationInfo ? (
          <div className="text-center">
            <p className="text-sm text-base-content/70 mb-2">Current shooting from</p>
            <p className="text-4xl md:text-5xl font-bold text-primary">
              {locationInfo.location.location_name}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-2xl font-bold">Test Complete!</p>
          </div>
        )}
      </div>

      {/* Bottom Section - Buttons */}
      <div className="bg-base-100 border-t border-base-content/10 p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {testStatus === 'active' && locationInfo ? (
            <>
              <button
                onClick={() => handleShot(true)}
                className="btn btn-success w-full h-20 md:h-24 text-2xl md:text-3xl font-bold"
                disabled={testStatus !== 'active'}
              >
                Made
              </button>
              <button
                onClick={() => handleShot(false)}
                className="btn btn-error w-full h-20 md:h-24 text-2xl md:text-3xl font-bold"
                disabled={testStatus !== 'active'}
              >
                Miss
              </button>
            </>
          ) : testStatus === 'countdown' ? (
            <div className="text-center py-8">
              <p className="text-xl font-semibold">Get ready...</p>
            </div>
          ) : testStatus === 'completing' ? (
            <div className="text-center py-8">
              <div className="loading loading-spinner loading-lg"></div>
              <p className="mt-4 text-lg font-semibold">Saving test results...</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
