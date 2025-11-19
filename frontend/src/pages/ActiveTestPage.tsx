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
  
  // New state for location selection
  const [activeLocationKey, setActiveLocationKey] = useState<string | null>(null);
  const [locationShotsCount, setLocationShotsCount] = useState<Record<string, number>>({});

  // Get current location info based on active location
  const getCurrentLocationInfo = () => {
    if (!testData || !testData.locations || !activeLocationKey) {
      return null;
    }

    const location = testData.locations.find((loc) => loc.location_key === activeLocationKey);
    if (!location) return null;

    const shotsInLocation = locationShotsCount[activeLocationKey] || 0;

    return {
      location,
      shotInLocation: shotsInLocation,
    };
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

  // Initialize location shots count when test data loads
  useEffect(() => {
    if (testData && testData.locations) {
      const initialCounts: Record<string, number> = {};
      testData.locations.forEach((location) => {
        initialCounts[location.location_key] = 0;
      });
      setLocationShotsCount(initialCounts);
    }
  }, [testData]);

  // Auto-select first location when test becomes active
  useEffect(() => {
    if (testStatus === 'active' && testData && testData.locations && testData.locations.length > 0 && !activeLocationKey) {
      // Sort by shot_order and select the first one
      const sortedLocations = [...testData.locations].sort((a, b) => a.shot_order - b.shot_order);
      setActiveLocationKey(sortedLocations[0].location_key);
    }
  }, [testStatus, testData, activeLocationKey]);

  // Countdown sequence
  useEffect(() => {
    if (testStatus === 'countdown' && testData && !countdownStartedRef.current) {
      countdownStartedRef.current = true;
      //Todo this is double sending toasts?
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

  // Handle location button click
  const handleLocationSelect = (locationKey: string) => {
    if (!testData) return;

    const location = testData.locations.find((loc) => loc.location_key === locationKey);
    if (!location) return;

    const shotsInLocation = locationShotsCount[locationKey] || 0;

    // Check if location is full
    if (shotsInLocation >= location.planned_shots) {
      toast.error(`${location.location_name} is full (${location.planned_shots}/${location.planned_shots} shots)`, {
        id: `location-full-${locationKey}`,
      });
      return;
    }

    setActiveLocationKey(locationKey);
  };

  // Handle shot recording
  const handleShot = async (made: boolean) => {
    if (testStatus !== 'active' || !activeLocationKey || !locationInfo) return;

    // Check if current location is full
    const shotsInLocation = locationShotsCount[activeLocationKey] || 0;
    if (shotsInLocation >= locationInfo.location.planned_shots) {
      toast.error('This location is full. Please select another location.', {
        id: 'location-full-error',
      });
      return;
    }

    const shot: RecordedShot = {
      shot_index: currentShot,
      court_location: activeLocationKey,
      made,
    };

    const updatedShots = [...recordedShots, shot];
    setRecordedShots(updatedShots);

    // Update location shots count
    setLocationShotsCount((prev) => ({
      ...prev,
      [activeLocationKey]: (prev[activeLocationKey] || 0) + 1,
    }));

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
  // TODO THIS ISNT CURRENTLY WORKING
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
    <div className="h-screen bg-base-200 flex flex-col overflow-hidden">
      {/* Top Section - Trackers */}
      <div className="bg-base-100 border-b border-base-content/10 p-4 flex-shrink-0">
        <div className="max-w-2xl mx-auto space-y-2">
          {/* Location Tracker */}
          {locationInfo && (
            <div className="text-center">
              <p className="text-sm text-base-content/70 mb-1">Current Location</p>
              <p className="text-xl font-bold">
                Shot {locationInfo.shotInLocation} / {locationInfo.location.planned_shots} for {locationInfo.location.location_name}
              </p>
            </div>
          )}

          {/* Overall Tracker */}
          <div className="text-center">
            <p className="text-sm text-base-content/70 mb-1">Overall Progress</p>
            <p className="text-xl font-bold">
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
      <div className="flex-1 flex flex-col items-center justify-start p-4 pt-2 overflow-y-auto min-h-0">
        {testStatus === 'countdown' ? (
          <div className="text-center">
            <p className="text-2xl font-bold">Get ready!</p>
          </div>
        ) : locationInfo ? (
          <>
            <div className="text-center mb-2 mt-2">
              <p className="text-sm text-base-content/70 mb-1">Currently shooting from: </p>
              <p className="text-3xl md:text-4xl font-bold text-primary">
                {locationInfo.location.location_name}
              </p>
            </div>

            {/* Location Selector Buttons */}
            {testStatus === 'active' && testData && (
              <div className="w-full max-w-2xl mt-1">
                <p className="text-sm text-base-content/70 mb-2 text-center">Select Location</p>
                {testData.locations.length <= 3 ? (
                  // Simple centered row for 3 or fewer locations
                  <div className="flex justify-center gap-2 md:gap-3 flex-wrap">
                    {testData.locations
                      .sort((a, b) => a.shot_order - b.shot_order)
                      .map((location) => {
                        const shotsInLocation = locationShotsCount[location.location_key] || 0;
                        const isFull = shotsInLocation >= location.planned_shots;
                        const isActive = activeLocationKey === location.location_key;

                        return (
                          <button
                            key={location.location_key}
                            onClick={() => handleLocationSelect(location.location_key)}
                            className={`btn relative min-h-[80px] md:min-h-[90px] px-3 py-2 ${
                              isActive
                                ? 'btn-primary'
                                : isFull
                                ? 'btn-disabled opacity-50'
                                : 'btn-outline'
                            }`}
                            disabled={testStatus !== 'active'}
                          >
                            <div className="flex flex-col items-center w-full">
                              <div className="flex flex-col items-center gap-1 w-full">
                                <span className="font-semibold text-sm md:text-base text-center break-words leading-tight">{location.location_name}</span>
                                {isActive && (
                                  <span className="badge badge-sm badge-success">Active</span>
                                )}
                              </div>
                              <span className="text-xs mt-1">
                                {shotsInLocation} / {location.planned_shots}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                ) : (
                  // Grid layout for 4+ locations
                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    {testData.locations
                      .sort((a, b) => a.shot_order - b.shot_order)
                      .map((location, index) => {
                        const shotsInLocation = locationShotsCount[location.location_key] || 0;
                        const isFull = shotsInLocation >= location.planned_shots;
                        const isActive = activeLocationKey === location.location_key;

                        // Map locations to U-shape positions (basketball court arc kinda thing, not perfect)
                        // Row 1: [Left Corner] [empty] [Right Corner]
                        // Row 2: [Left Wing]   [empty] [Right Wing]
                        // Row 3: [empty]       [Top]   [empty]
                        let gridRow = 1;
                        let gridCol = 1;
                        
                        if (testData.locations.length === 5) {
                          // Based on shot_order: 0=left_corner, 1=left_wing, 2=top, 3=right_wing, 4=right_corner
                          if (index === 0) {
                            // Left Corner - top left
                            gridRow = 1;
                            gridCol = 1;
                          } else if (index === 1) {
                            // Left Wing - middle left
                            gridRow = 2;
                            gridCol = 1;
                          } else if (index === 2) {
                            // Top of Arc - bottom center
                            gridRow = 3;
                            gridCol = 2;
                          } else if (index === 3) {
                            // Right Wing - middle right
                            gridRow = 2;
                            gridCol = 3;
                          } else if (index === 4) {
                            // Right Corner - top right
                            gridRow = 1;
                            gridCol = 3;
                          }
                        } else {
                          // simple row layout for other test types to avoid weird layout issues
                          gridRow = Math.floor(index / 3) + 1;
                          gridCol = (index % 3) + 1;
                        }

                        return (
                          <button
                            key={location.location_key}
                            onClick={() => handleLocationSelect(location.location_key)}
                            className={`btn relative min-h-[80px] md:min-h-[90px] px-3 py-2 ${
                              isActive
                                ? 'btn-primary'
                                : isFull
                                ? 'btn-disabled opacity-50'
                                : 'btn-outline'
                            }`}
                            disabled={testStatus !== 'active'}
                            style={{
                              gridRow: gridRow,
                              gridColumn: gridCol,
                            }}
                          >
                            <div className="flex flex-col items-center w-full">
                              <div className="flex flex-col items-center gap-1 w-full">
                                <span className="font-semibold text-sm md:text-base text-center break-words leading-tight">{location.location_name}</span>
                                {isActive && (
                                  <span className="badge badge-sm badge-success">Active</span>
                                )}
                              </div>
                              <span className="text-xs mt-1">
                                {shotsInLocation} / {location.planned_shots}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="text-2xl font-bold">Test Complete!</p>
          </div>
        )}
      </div>

      {/* Bottom Section - Buttons */}
      <div className="bg-base-100 border-t border-base-content/10 p-4 flex-shrink-0">
        <div className="max-w-2xl mx-auto space-y-2">
          {testStatus === 'active' && locationInfo ? (
            <>
            {/* Handle activiating/deactiviating location buttons */}
              <button
                onClick={() => handleShot(true)}
                className="btn btn-success w-full h-20 md:h-24 text-2xl md:text-3xl font-bold"
                disabled={
                  testStatus !== 'active' ||
                  !activeLocationKey ||
                  (locationShotsCount[activeLocationKey] || 0) >= locationInfo.location.planned_shots
                }
              >
                Make
              </button>
              <button
                onClick={() => handleShot(false)}
                className="btn btn-error w-full h-20 md:h-24 text-2xl md:text-3xl font-bold"
                disabled={
                  testStatus !== 'active' ||
                  !activeLocationKey ||
                  (locationShotsCount[activeLocationKey] || 0) >= locationInfo.location.planned_shots
                }
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
