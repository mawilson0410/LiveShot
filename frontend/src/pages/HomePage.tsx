import RecentTests from '../components/RecentTests'
import Leaderboard from '../components/Leaderboard'

const HomePage = () => {
  return (
    <div className="min-h-screen">
      <Leaderboard />
      <RecentTests />
    </div>
  )
}

export default HomePage