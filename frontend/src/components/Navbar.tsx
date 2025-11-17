import { Link, } from "react-router-dom";
import { Medal } from "lucide-react";
import { useState } from "react";
import ThemeSelector from "./ThemeSelector.tsx";
import StartTestModal from "./StartTestModal.tsx";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleStartTest = (testId: number) => {
    navigate(`/active-test/${testId}`);
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

            {/* RIGHT SECTION */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
              >
                Start a new test
              </button>
              <ThemeSelector />
            </div>
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