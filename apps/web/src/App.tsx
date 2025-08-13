import ContributionsCalendar from './components/ContributionsCalendar'

function App() {
  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center space-y-4 py-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-center">Bitácora</h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto text-center">
            Track your daily contributions and build consistent habits
          </p>
        </header>
        
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl md:text-2xl font-semibold mb-6 text-center">Contribution Activity</h2>
          <ContributionsCalendar className="overflow-x-auto" />
        </div>
      </div>
    </div>
  )
}

export default App
