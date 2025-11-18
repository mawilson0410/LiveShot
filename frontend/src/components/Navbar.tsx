import { Link, } from "react-router-dom";
import { Medal, SearchIcon, MenuIcon, XIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ThemeSelector from "./ThemeSelector.tsx";
import StartTestModal from "./StartTestModal.tsx";
import { useNavigate } from "react-router-dom";
import { playerService, type Player } from "../services/playerService.ts";

function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleStartTest = (testId: number) => {
    navigate(`/active-test/${testId}`);
  };

  // Load players when search is opened
  useEffect(() => {
    if (isSearchOpen && players.length === 0) {
      const loadPlayers = async () => {
        try {
          setLoading(true);
          const data = await playerService.getAllPlayers();
          setPlayers(data);
        } catch (error) {
          console.error('Error loading players:', error);
        } finally {
          setLoading(false);
        }
      };
      loadPlayers();
    }
  }, [isSearchOpen, players.length]);

  // Close desktop search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking inside the search dropdown
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(target)) {
        setIsSearchOpen(false);
        setSearchTerm('');
      }
    };

    if (isSearchOpen && !isMobileMenuOpen && desktopSearchRef.current) {
      // Use a delay to ensure button clicks process first, not sure this is the best way to do this
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isSearchOpen, isMobileMenuOpen]);

  // Close mobile search suggestuions when clicking outside in the menu. Werid bug
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking inside the search dropdown or input
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(target)) {
        setIsSearchOpen(false);
        setSearchTerm('');
      }
    };

    if (isSearchOpen && isMobileMenuOpen && mobileSearchRef.current) {
      document.addEventListener('click', handleClickOutside);

      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isSearchOpen, isMobileMenuOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        // Check if click is not on the hamburger button
        const target = event.target as HTMLElement;
        if (!target.closest('[data-hamburger-button]')) {
          setIsMobileMenuOpen(false);
          // Also close search dropdown when menu closes
          setIsSearchOpen(false);
          setSearchTerm('');
        }
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);
  
  // Filter players by search term
  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (player.team && player.team.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (player.number && player.number.includes(searchTerm))
  );

  // Navigate to player page and close mobile menu (if its open)
  const handlePlayerSelect = (playerId: number) => {
    setIsSearchOpen(false);
    setSearchTerm('');
    setIsMobileMenuOpen(false);
    navigate(`/player/${playerId}`);
  };

  // Open start test modal and close mobile menu
  const handleStartTestClick = () => {
    setIsModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div className="bg-base-100/80 backdrop-blur-lg border-b border-base-content/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="navbar px-4 min-h-[4rem] justify-between">
            {/* LOGO */}
            <div className="flex-1 lg:flex-none">
              <Link to="/" className="hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-2">
                  <Medal className="size-9 text-primary" />
                  <span
                    className="font-sans font-bold tracking-widest text-2xl 
                      bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
                  >
                    LiveShot
                  </span>
                </div>
              </Link>
            </div>

            {/* MIDDLE SECTION - Search (Desktop Only) */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="relative" ref={desktopSearchRef}>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-base-content/50" />
                  <input
                    type="text"
                    placeholder="Find a player"
                    className="input input-bordered w-full pl-10 pr-4"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsSearchOpen(true)}
                  />
                </div>

                {/* Dropdown Results */}
                {isSearchOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-content/10 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                    {loading ? (
                      <div className="p-4 text-center">
                        <div className="loading loading-spinner loading-sm"></div>
                      </div>
                    ) : filteredPlayers.length === 0 ? (
                      <div className="p-4 text-center text-base-content/60">
                        {searchTerm ? 'No players found' : 'Start typing to search...'}
                      </div>
                    ) : (
                      <div className="py-2">
                        {filteredPlayers.map((player) => (
                          <button
                            key={player.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayerSelect(player.id);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-base-200 transition-colors flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <div className="font-semibold">{player.name}</div>
                              <div className="text-sm text-base-content/60 flex items-center gap-2">
                                {player.number && (
                                  <span className="badge badge-primary badge-sm">#{player.number}</span>
                                )}
                                {player.team && (
                                  <span>{player.team}</span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SECTION */}
            <div className="flex items-center gap-4">
              {/* Desktop: Start Test Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary hidden md:inline-flex"
              >
                Start a new test
              </button>
              
              {/* Mobile: Hamburger Menu Button */}
              <button
                data-hamburger-button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="btn btn-ghost btn-sm md:hidden"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <XIcon className="size-5" />
                ) : (
                  <MenuIcon className="size-5" />
                )}
              </button>
              
              <ThemeSelector />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" />
      )}

      {/* Mobile Menu Slide-out */}
      <div
        ref={mobileMenuRef}
        className={`fixed top-0 left-0 h-full w-80 bg-base-100 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-base-content/10">
            <h2 className="text-xl font-bold">Menu</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Close menu"
            >
              <XIcon className="size-5" />
            </button>
          </div>

          {/* Mobile Menu Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Search Bar */}
            <div className="relative" ref={mobileSearchRef}>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-base-content/50" />
                <input
                  type="text"
                  placeholder="Find a player"
                  className="input input-bordered w-full pl-10 pr-4"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                />
              </div>

              {/* Dropdown Results */}
              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-content/10 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                  {loading ? (
                    <div className="p-4 text-center">
                      <div className="loading loading-spinner loading-sm"></div>
                    </div>
                  ) : filteredPlayers.length === 0 ? (
                    <div className="p-4 text-center text-base-content/60">
                      {searchTerm ? 'No players found' : 'Start typing to search...'}
                    </div>
                  ) : (
                    <div className="py-2">
                      {filteredPlayers.map((player) => (
                        <button
                          key={player.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayerSelect(player.id);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-base-200 transition-colors flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="font-semibold">{player.name}</div>
                            <div className="text-sm text-base-content/60 flex items-center gap-2">
                              {player.number && (
                                <span className="badge badge-primary badge-sm">#{player.number}</span>
                              )}
                              {player.team && (
                                <span>{player.team}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Start Test Button */}
            <button
              onClick={handleStartTestClick}
              className="btn btn-primary w-full"
            >
              Start a new test
            </button>
          </div>
        </div>
      </div>

      <StartTestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStartTest={handleStartTest}
      />
    </>
  );
}
export default Navbar;