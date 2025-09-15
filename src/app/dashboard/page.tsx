export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to Your Dashboard! 🎮
          </h1>
          <p className="text-gray-600">
            Your personal growth journey starts here
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* LifeStat Matrix Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📊 Your LifeStat Matrix
            </h2>
            <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Matrix visualization coming soon!</p>
            </div>
          </div>

          {/* Adventure Mode Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🗺️ Adventure Mode
            </h2>
            <p className="text-gray-600 mb-4">
              Set goals and track your real-world progress
            </p>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
              Start Adventure
            </button>
          </div>

          {/* Architect Mode Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🏗️ Architect Mode
            </h2>
            <p className="text-gray-600 mb-4">
              Simulate different growth paths and scenarios
            </p>
            <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors">
              Plan Your Path
            </button>
          </div>

          {/* Recent Goals Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🎯 Recent Goals
            </h2>
            <div className="space-y-2">
              <p className="text-gray-500 text-sm">No goals set yet</p>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Create your first goal →
              </button>
            </div>
          </div>

          {/* Peer Comparison Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              👥 Peer Insights
            </h2>
            <div className="space-y-2">
              <p className="text-gray-500 text-sm">
                Complete your profile to see comparisons
              </p>
              <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                View insights →
              </button>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              ⚡ Quick Actions
            </h2>
            <div className="space-y-2">
              <button className="w-full text-left text-blue-600 hover:text-blue-700 text-sm">
                📝 Weekly Check-in
              </button>
              <button className="w-full text-left text-purple-600 hover:text-purple-700 text-sm">
                🔄 Update Skills
              </button>
              <button className="w-full text-left text-green-600 hover:text-green-700 text-sm">
                👨‍👩‍👧‍👦 Family Mode
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
