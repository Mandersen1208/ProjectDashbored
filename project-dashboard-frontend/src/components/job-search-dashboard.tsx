import { Search, Loader2, ChevronLeft, ChevronRight, ExternalLink, Filter, Calendar as CalendarIcon, BookmarkPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "../services/api";
import type { JobResult, SavedQuery } from "../types";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { format } from "date-fns";

interface JobSearchDashboardProps {
  savedQueryToExecute?: any;
  onQueryExecuted?: () => void;
  onQuerySaved?: () => void; // Callback when a query is successfully saved
}

export function JobSearchDashboard({ savedQueryToExecute, onQueryExecuted, onQuerySaved }: JobSearchDashboardProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("New York");
  const [distance, setDistance] = useState("10");
  const [excludeTerms, setExcludeTerms] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Application tracking state
  const [selectedJob, setSelectedJob] = useState<JobResult | null>(null);
  const [applicationStatus, setApplicationStatus] = useState("applied");
  const [applicationNotes, setApplicationNotes] = useState("");
  const [resumeVersion, setResumeVersion] = useState("");
  const [coverLetterVersion, setCoverLetterVersion] = useState("");
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);

  // Filter state
  const [filterText, setFilterText] = useState("");

  // Date range state
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  // Listen for saved query to execute
  useEffect(() => {
    if (savedQueryToExecute) {
      // Populate form fields
      setJobTitle(savedQueryToExecute.query);
      setLocation(savedQueryToExecute.location);
      setDistance(savedQueryToExecute.distance?.toString() || "10");
      
      // Execute search automatically
      executeSearch(savedQueryToExecute);
      
      // Notify parent that query has been executed
      onQueryExecuted?.();
    }
  }, [savedQueryToExecute]);

  const executeSearch = async (queryData: SavedQuery) => {
    setIsLoading(true);
    setShowResults(false);
    setError(null);
    setCurrentPage(1);
    setFilterText("");

    try {
      const searchParams: any = {
        query: queryData.query,
        location: queryData.location,
        distance: queryData.distance || 10,
      };

      const response = await api.searchJobs(searchParams);
      setJobs(response.results);
      setShowResults(true);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.response?.data?.message || "Failed to search jobs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    // Text filter
    const matchesFilter = filterText === "" ||
      job.title.toLowerCase().includes(filterText.toLowerCase()) ||
      job.companyName.toLowerCase().includes(filterText.toLowerCase()) ||
      job.locationName.toLowerCase().includes(filterText.toLowerCase()) ||
      job.categoryName.toLowerCase().includes(filterText.toLowerCase());

    // Date range filter
    let matchesDateRange = true;
    if (dateFrom || dateTo) {
      const jobDate = new Date(job.createdDate);
      if (dateFrom && jobDate < dateFrom) {
        matchesDateRange = false;
      }
      if (dateTo && jobDate > dateTo) {
        matchesDateRange = false;
      }
    }

    return matchesFilter && matchesDateRange;
  });

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredJobs.slice(startIndex, endIndex);

  const handleSearch = async () => {
    if (!jobTitle || !location) {
      setError("Please enter both job title and location");
      return;
    }

    setIsLoading(true);
    setShowResults(false);
    setError(null);
    setCurrentPage(1);
    setFilterText(""); // Reset filter on new search

    try {
      const searchParams: any = {
        query: jobTitle,
        location: location,
        distance: parseInt(distance),
      };

      // Add exclude terms if provided
      if (excludeTerms.trim()) {
        searchParams.excludedTerms = excludeTerms.trim();
      }

      // Add date parameters if they're set
      if (dateFrom) {
        searchParams.dateFrom = format(dateFrom, 'yyyy-MM-dd');
      }
      if (dateTo) {
        searchParams.dateTo = format(dateTo, 'yyyy-MM-dd');
      }

      const response = await api.searchJobs(searchParams);
      setJobs(response.results);
      setShowResults(true);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.response?.data?.message || "Failed to search jobs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSearch = async () => {
    if (!jobTitle || !location) {
      setError("Please enter both job title and location to save");
      return;
    }

    const currentUser = api.getCurrentUser();
    if (!currentUser) {
      setError("You must be logged in to save searches");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        userId: currentUser.id,
        query: jobTitle,
        location: location,
        distance: parseInt(distance),
        isActive: true,
      };
      
      const response = await api.createSavedQuery(payload);

      // Safely show success message
      try {
        alert(response || "Search saved successfully! Your saved searches will be automatically updated.");
      } catch (alertErr) {
        console.error("Alert error:", alertErr);
      }
      
      // Notify parent component to refresh saved queries list
      if (onQuerySaved) {
        onQuerySaved();
      }
      
      setError(null);
    } catch (err: any) {
      console.error("Save search error:", err);
      try {
        if (err.response?.status === 409) {
          // Duplicate entry - show friendly alert
          alert(err.response?.data || "You've already saved this search!\n\nYou can view and manage it in your Saved Searches page.");
        } else if (err.response?.status === 400) {
          // Bad request - show error in UI
          setError(err.response?.data || "Unable to save search. Please make sure you're logged in.");
        } else {
          // Other errors - show in UI
          setError(err.response?.data || "Failed to save search. Please try again.");
        }
      } catch (alertErr) {
        console.error("Alert error:", alertErr);
        setError("Search operation completed but there was a display issue.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddApplication = async () => {
    if (!selectedJob) return;

    setIsSubmittingApp(true);
    try {
      const currentUser = api.getCurrentUser();
      if (!currentUser) {
        alert("Please sign in to track applications.");
        setIsSubmittingApp(false);
        return;
      }
      await api.createApplication({
        userId: currentUser.id,
        jobTitle: selectedJob.title,
        companyName: selectedJob.companyName || undefined,
        jobUrl: selectedJob.jobUrl || undefined,
        location: selectedJob.locationName || undefined,
        status: applicationStatus as "applied" | "phone_screen" | "interview" | "offer" | "rejected",
        notes: applicationNotes || undefined,
        resumeVersion: resumeVersion || undefined,
        coverLetterVersion: coverLetterVersion || undefined,
      });

      alert("Application tracked successfully! View it in the Applications tab.");
      
      // Reset modal state
      setSelectedJob(null);
      setApplicationStatus("applied");
      setApplicationNotes("");
      setResumeVersion("");
      setCoverLetterVersion("");
    } catch (error) {
      console.error("Error adding application:", error);
      alert("Failed to track application. Please try again.");
    } finally {
      setIsSubmittingApp(false);
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

  const handleFilterChange = (value: string) => {
    setFilterText(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    setCurrentPage(1); // Reset to first page when date changes
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    setCurrentPage(1); // Reset to first page when date changes
  };

  const clearFilters = () => {
    setFilterText("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setCurrentPage(1);
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

          {/* Exclude Terms */}
          <div>
            <label htmlFor="exclude-terms" className="block mb-2 text-gray-800">
              Exclude Terms (optional)
            </label>
            <input
              id="exclude-terms"
              type="text"
              value={excludeTerms}
              onChange={(e) => setExcludeTerms(e.target.value)}
              placeholder="e.g. senior, manager (comma separated)"
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

          {/* Posted Date From */}
          <div>
            <label className="block mb-2 text-gray-800">
              Posted After
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all text-left flex items-center justify-between"
                >
                  <span className={dateFrom ? "text-gray-900" : "text-gray-400"}>
                    {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                  </span>
                  <CalendarIcon className="w-5 h-5 text-gray-500" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={handleDateFromChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Posted Date To */}
          <div>
            <label className="block mb-2 text-gray-800">
              Posted Before
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all text-left flex items-center justify-between"
                >
                  <span className={dateTo ? "text-gray-900" : "text-gray-400"}>
                    {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                  </span>
                  <CalendarIcon className="w-5 h-5 text-gray-500" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={handleDateToChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Search Buttons */}
        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
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
          
          <button
            onClick={handleSaveSearch}
            disabled={isSaving || !jobTitle || !location}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-purple-700 hover:from-blue-800 hover:to-purple-800 text-white px-8 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <BookmarkPlus className="w-5 h-5" />
                Save Search
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
              {filteredJobs.length} of {jobs.length} Job{jobs.length !== 1 ? 's' : ''} {filteredJobs.length !== jobs.length ? 'Filtered' : 'Found'}
            </h2>
          </div>

          {/* Filter Controls */}
          <div className="mb-6 flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="filter" className="block mb-2 text-gray-800 text-sm">
                Filter Results
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="filter"
                  type="text"
                  value={filterText}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  placeholder="Filter by title, company, location, or category..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            {(filterText || dateFrom || dateTo) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors border-2 border-purple-200"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Active Filters Display */}
          {(dateFrom || dateTo) && (
            <div className="mb-4 flex gap-2 flex-wrap">
              {dateFrom && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2">
                  After: {format(dateFrom, "PP")}
                  <button onClick={() => handleDateFromChange(undefined)} className="hover:text-purple-900">×</button>
                </span>
              )}
              {dateTo && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2">
                  Before: {format(dateTo, "PP")}
                  <button onClick={() => handleDateToChange(undefined)} className="hover:text-purple-900">×</button>
                </span>
              )}
            </div>
          )}

          {filteredJobs.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              {jobs.length === 0 ? "No jobs found. Try adjusting your search criteria." : "No jobs match your filters. Try clearing or adjusting the filters."}
            </p>
          ) : (
            <div className="space-y-4">
              {currentData.map((job) => (
                <div key={job.id} className="border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-shadow bg-white">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                      </div>
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
                    <div className="ml-4 flex flex-col gap-2">
                      <a
                        href={job.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg transition-all whitespace-nowrap"
                      >
                        View Job
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <Dialog open={selectedJob?.id === job.id} onOpenChange={(open) => !open && setSelectedJob(null)}>
                        <DialogTrigger asChild>
                          <button
                            onClick={() => setSelectedJob(job)}
                            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all whitespace-nowrap"
                          >
                            Track Application
                            <BookmarkPlus className="w-4 h-4" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md bg-white">
                          <DialogHeader>
                            <DialogTitle>Track Application</DialogTitle>
                            <DialogDescription>
                              Add this job to your applications tracker
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Job Title</label>
                              <input
                                type="text"
                                value={selectedJob?.title || ""}
                                disabled
                                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Company</label>
                              <input
                                type="text"
                                value={selectedJob?.companyName || "Unknown"}
                                disabled
                                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="status" className="text-sm font-medium">Status</label>
                              <Select value={applicationStatus} onValueChange={setApplicationStatus}>
                                <SelectTrigger id="status" className="bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  <SelectItem value="applied">Applied</SelectItem>
                                  <SelectItem value="phone_screen">Phone Screen</SelectItem>
                                  <SelectItem value="interview">Interview</SelectItem>
                                  <SelectItem value="offer">Offer</SelectItem>
                                  <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</label>
                              <Textarea
                                id="notes"
                                placeholder="Add any notes about this application..."
                                value={applicationNotes}
                                onChange={(e) => setApplicationNotes(e.target.value)}
                                rows={3}
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="resume" className="text-sm font-medium">Resume Version (Optional)</label>
                              <input
                                id="resume"
                                type="text"
                                placeholder="e.g., Resume_v2.pdf"
                                value={resumeVersion}
                                onChange={(e) => setResumeVersion(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="cover" className="text-sm font-medium">Cover Letter Version (Optional)</label>
                              <input
                                id="cover"
                                type="text"
                                placeholder="e.g., CoverLetter_CompanyName.pdf"
                                value={coverLetterVersion}
                                onChange={(e) => setCoverLetterVersion(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedJob(null)}
                              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleAddApplication}
                              disabled={isSubmittingApp}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                            >
                              {isSubmittingApp ? "Adding..." : "Track Application"}
                            </button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredJobs.length > 0 && (
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
                  per page | Showing {startIndex + 1} to {Math.min(endIndex, filteredJobs.length)} of {filteredJobs.length} results
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