import { Search, Loader2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useState } from "react";
import { api, type JobResult } from "../services/api";

export function JobSearchDashboard() {
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("New York");
  const [distance, setDistance] = useState("10");
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(jobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = jobs.slice(startIndex, endIndex);

  const handleSearch = async () => {
    if (!jobTitle || !location) {
      setError("Please enter both job title and location");
      return;
    }

    setIsLoading(true);
    setShowResults(false);
    setError(null);
    setCurrentPage(1);

    try {
      const response = await api.searchJobs({
        query: jobTitle,
        location: location,
        distance: parseInt(distance),
      });

      setJobs(response.results);
      setShowResults(true);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.response?.data?.message || "Failed to search jobs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
        <h1 className="mb-6 bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">Job Search</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Job Category/Title */}
          <div>
            <label htmlFor="job-title" className="block mb-2 text-gray-800">
              Job Category/Title
            </label>
            <input
              id="job-title"
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Software Engineer"
              className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block mb-2 text-gray-800">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or Zip Code"
              className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Distance */}
          <div>
            <label htmlFor="distance" className="block mb-2 text-gray-800">
              Distance (miles)
            </label>
            <select
              id="distance"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all"
            >
              <option value="5">5 miles</option>
              <option value="10">10 miles</option>
              <option value="15">15 miles</option>
              <option value="25">25 miles</option>
              <option value="50">50 miles</option>
              <option value="100">100 miles</option>
            </select>
          </div>
        </div>

        {/* Search Button */}
        <div className="flex justify-center md:justify-start">
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Search Jobs
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl shadow-lg p-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mt-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-12 flex flex-col items-center justify-center border border-white/20">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full blur-xl opacity-50"></div>
            <Loader2 className="relative w-16 h-16 text-purple-600 animate-spin mb-4" />
          </div>
          <p className="text-gray-700 mt-4">Searching for jobs...</p>
        </div>
      )}

      {/* Results Table */}
      {showResults && !isLoading && (
        <div className="mt-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          <h2 className="mb-6 bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
            {jobs.length} Job{jobs.length !== 1 ? 's' : ''} Found
          </h2>

          {jobs.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No jobs found. Try adjusting your search criteria.</p>
          ) : (
            <div className="space-y-4">
              {currentData.map((job) => (
                <div key={job.id} className="border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-shadow bg-white">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                      <p className="text-gray-600 mb-1">{job.companyName}</p>
                      <p className="text-gray-500 mb-3">{job.locationName}</p>
                      {(job.salaryMin || job.salaryMax) && (
                        <p className="text-green-600 font-medium mb-3">
                          ${job.salaryMin?.toLocaleString()} - ${job.salaryMax?.toLocaleString()}
                        </p>
                      )}
                      <p className="text-gray-700 text-sm line-clamp-2 mb-3"
                         dangerouslySetInnerHTML={{ __html: job.description }}
                      />
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                          {job.categoryName}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {job.source}
                        </span>
                      </div>
                    </div>
                    <a
                      href={job.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg transition-all whitespace-nowrap"
                    >
                      View Job
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {jobs.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-gray-600">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="px-3 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-700"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-gray-600">
                  per page | Showing {startIndex + 1} to {Math.min(endIndex, jobs.length)} of {jobs.length} results
                </span>
              </div>
              <div className="flex items-center gap-2">
              <button
                onClick={goToPrevious}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border-2 border-purple-200 text-gray-700 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              
              <div className="flex gap-1">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => goToPage(page as number)}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-transparent'
                          : 'border-purple-200 text-gray-700 hover:bg-purple-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              <button
                onClick={goToNext}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border-2 border-purple-200 text-gray-700 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}