import RecentTests from '../components/RecentTests'
import Leaderboard from '../components/Leaderboard'

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <Leaderboard />
        <RecentTests />
      </div>
      {/* Footer so I can attribute myself and link my portfolio */}
      <footer className="mt-auto py-8 text-center">
        <p className="text-base-content/60 text-sm">
          LiveShot designed and developed by{' '}
          <a
            href="https://michaelawilson.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-focus transition-colors underline"
          >
            Michael Wilson
          </a>
        </p>
      </footer>
    </div>
  )
}

export default HomePage