import { Search, Briefcase, Filter, Zap } from "lucide-react";

interface HomePageProps {
onSwitchToSignup: () => void;
}

export function HomePage({ onSwitchToSignup }: HomePageProps) {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-white mb-6">
          Welcome to Project Dashboard
        </h1>
        <p className="text-white/90 text-xl max-w-3xl mx-auto mb-8">
          Working to simplify looking for a job and get rid of the clutter that is around it
        </p>
        <button
          onClick={onSwitchToSignup}
          className="bg-white text-purple-600 px-8 py-4 rounded-xl hover:bg-white/90 transition-all transform hover:scale-105 shadow-2xl"
        >
          Get Started
        </button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center hover:bg-white/20 transition-all">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-white mb-2">Smart Search</h3>
          <p className="text-white/80">Find jobs quickly with our intelligent search filters</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center hover:bg-white/20 transition-all">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-white mb-2">Advanced Filters</h3>
          <p className="text-white/80">Filter by location, distance, and category</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center hover:bg-white/20 transition-all">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-white mb-2">Organized Results</h3>
          <p className="text-white/80">View all opportunities in one clean interface</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center hover:bg-white/20 transition-all">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-white mb-2">Fast & Simple</h3>
          <p className="text-white/80">No clutter, just the information you need</p>
        </div>
      </div>
    </div>
  );
}
