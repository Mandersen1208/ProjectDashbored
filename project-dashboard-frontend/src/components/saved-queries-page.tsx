import { BookmarkCheck, ToggleLeft, ToggleRight, Trash2, Play, Pause } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../services/api";
import type { SavedQuery } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";

interface SavedQueriesPageProps {
  onExecuteQuery?: (query: SavedQuery) => void;
}

export function SavedQueriesPage({ onExecuteQuery }: SavedQueriesPageProps) {
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedQueries();
  }, []);

  const fetchSavedQueries = async () => {
    try {
      setLoading(true);
      setError(null);
      const queries = await api.getSavedQueries();
      setSavedQueries(queries);
    } catch (err: any) {
      console.error("Error fetching saved queries:", err);
      setError(err.response?.data?.message || "Failed to load saved queries");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      setError(null); // Clear any existing errors
      await api.toggleSavedQuery(id);
      await fetchSavedQueries();
    } catch (err: any) {
      console.error("Error toggling query:", err);
      setError(err.response?.data?.message || "Failed to toggle query");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this saved search?")) {
      return;
    }
    
    try {
      setError(null); // Clear any existing errors
      await api.deleteSavedQuery(id);
      // Remove from local state immediately for better UX
      setSavedQueries(prev => prev.filter(q => q.id !== id));
    } catch (err: any) {
      console.error("Error deleting query:", err);
      setError(err.response?.data?.message || "Failed to delete query");
      // Refresh to ensure state is correct
      await fetchSavedQueries();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <div className="flex items-center gap-3">
          <BookmarkCheck className="w-8 h-8 text-purple-600" />
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Saved Searches
            </h2>
            <p className="text-gray-600 mt-1">
              Manage your saved job searches for automatic updates
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-16">
          <div className="text-gray-600">Loading saved searches...</div>
        </div>
      ) : savedQueries.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16">
          <BookmarkCheck className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Saved Searches Yet
          </h3>
          <p className="text-gray-500">
            Start by saving a search from the Job Search page
          </p>
        </div>
      ) : (
        /* Table */
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-gray-700 font-semibold">Job Title</TableHead>
                <TableHead className="text-gray-700 font-semibold">Location</TableHead>
                <TableHead className="text-gray-700 font-semibold text-center">Distance</TableHead>
                <TableHead className="text-gray-700 font-semibold text-center">Status</TableHead>
                <TableHead className="text-gray-700 font-semibold text-center">New Jobs</TableHead>
                <TableHead className="text-gray-700 font-semibold">Last Run</TableHead>
                <TableHead className="text-gray-700 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savedQueries.map((query) => (
                <TableRow 
                  key={query.id} 
                  className="hover:bg-gray-50"
                >
                  <TableCell className="font-medium text-gray-900">
                    <button
                      onClick={() => onExecuteQuery?.(query)}
                      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium transition-colors text-left"
                      title="Click to execute this search"
                    >
                      {query.query}
                    </button>
                  </TableCell>
                  <TableCell className="text-gray-700">{query.location}</TableCell>
                  <TableCell className="text-gray-700 text-center">
                    {query.distance} mi
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={query.isActive ? "default" : "secondary"}
                      className={
                        query.isActive
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-gray-400 hover:bg-gray-500"
                      }
                    >
                      {query.isActive ? (
                        <>
                          <Play className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <Pause className="w-3 h-3 mr-1" />
                          Paused
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={(query.newJobsCount ?? 0) > 0 ? "default" : "outline"}
                      className={
                        (query.newJobsCount ?? 0) > 0
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "border-gray-300 text-gray-500"
                      }
                    >
                      {query.newJobsCount ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {formatDate(query.lastRunAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(query.id!)}
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        title={query.isActive ? "Pause search" : "Activate search"}
                      >
                        {query.isActive ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(query.id!)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete search"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
