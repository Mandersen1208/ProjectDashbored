import { useEffect, useState } from "react";
import { Briefcase, Trash2, Filter } from "lucide-react";
import api from "../services/api";
import type { Application, ApplicationStats, ApplicationStatus } from "../types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, []);

  useEffect(() => {
    if (filterStatus === "all") {
      setFilteredApplications(applications);
    } else {
      setFilteredApplications(applications.filter(app => app.status === filterStatus));
    }
  }, [filterStatus, applications]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getApplications();
      setApplications(data);
      setFilteredApplications(data);
    } catch (err: any) {
      console.error("Error fetching applications:", err);
      setError(err.response?.data?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.getApplicationStats();
      setStats(data);
    } catch (err: any) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleStatusChange = async (id: number, newStatus: ApplicationStatus) => {
    try {
      setError(null);
      await api.updateApplicationStatus(id, newStatus);
      await fetchApplications();
      await fetchStats();
    } catch (err: any) {
      console.error("Error updating status:", err);
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this application?")) {
      return;
    }

    try {
      setError(null);
      await api.deleteApplication(id);
      setApplications(prev => prev.filter(app => app.id !== id));
      await fetchStats();
    } catch (err: any) {
      console.error("Error deleting application:", err);
      setError(err.response?.data?.message || "Failed to delete application");
      await fetchApplications();
    }
  };

  const getStatusColor = (status: ApplicationStatus): string => {
    const colors: Record<ApplicationStatus, string> = {
      applied: "bg-blue-600 hover:bg-blue-700 text-white",
      phone_screen: "bg-purple-600 hover:bg-purple-700 text-white",
      interview: "bg-yellow-600 hover:bg-yellow-700 text-white",
      offer: "bg-green-600 hover:bg-green-700 text-white",
      rejected: "bg-red-600 hover:bg-red-700 text-white",
      withdrawn: "bg-gray-600 hover:bg-gray-700 text-white",
    };
    return colors[status] || "bg-gray-600";
  };

  const getStatusLabel = (status: ApplicationStatus): string => {
    const labels: Record<ApplicationStatus, string> = {
      applied: "Applied",
      phone_screen: "Phone Screen",
      interview: "Interview",
      offer: "Offer",
      rejected: "Rejected",
      withdrawn: "Withdrawn",
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-purple-600" />
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                My Applications
              </h2>
              <p className="text-gray-600 mt-1">
                Track your job applications and interview progress
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-800">{stats.applied}</div>
            <div className="text-sm text-blue-600">Applied</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-800">{stats.phone_screen}</div>
            <div className="text-sm text-purple-600">Phone Screen</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-800">{stats.interview}</div>
            <div className="text-sm text-yellow-600">Interview</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-800">{stats.offer}</div>
            <div className="text-sm text-green-600">Offers</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-800">{stats.rejected}</div>
            <div className="text-sm text-red-600">Rejected</div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <Filter className="w-5 h-5 text-gray-600" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48 bg-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">All Applications</SelectItem>
            <SelectItem value="applied">
              <Badge className="bg-blue-600 text-white">Applied</Badge>
            </SelectItem>
            <SelectItem value="phone_screen">
              <Badge className="bg-purple-600 text-white">Phone Screen</Badge>
            </SelectItem>
            <SelectItem value="interview">
              <Badge className="bg-yellow-600 text-white">Interview</Badge>
            </SelectItem>
            <SelectItem value="offer">
              <Badge className="bg-green-600 text-white">Offer</Badge>
            </SelectItem>
            <SelectItem value="rejected">
              <Badge className="bg-red-600 text-white">Rejected</Badge>
            </SelectItem>
            <SelectItem value="withdrawn">
              <Badge className="bg-gray-600 text-white">Withdrawn</Badge>
            </SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-600">
          Showing {filteredApplications.length} of {applications.length} applications
        </span>
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
          <div className="text-gray-600">Loading applications...</div>
        </div>
      ) : filteredApplications.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16">
          <Briefcase className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {filterStatus === "all" ? "No Applications Yet" : `No ${getStatusLabel(filterStatus as ApplicationStatus)} Applications`}
          </h3>
          <p className="text-gray-500 mb-4">
            {filterStatus === "all" 
              ? "Start applying to jobs and track them here!"
              : "Try changing the filter to see other applications."}
          </p>
        </div>
      ) : (
        /* Table */
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-gray-700 font-semibold">Job Title</TableHead>
                <TableHead className="text-gray-700 font-semibold">Company</TableHead>
                <TableHead className="text-gray-700 font-semibold">Location</TableHead>
                <TableHead className="text-gray-700 font-semibold">Date Applied</TableHead>
                <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                <TableHead className="text-gray-700 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((app) => (
                <TableRow key={app.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900">
                    {app.jobUrl ? (
                      <a
                        href={app.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {app.jobTitle || "Unknown Position"}
                      </a>
                    ) : (
                      app.jobTitle || "Unknown Position"
                    )}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {app.companyName || "Unknown"}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {app.location || "Remote"}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {app.dateApplied ? formatDate(app.dateApplied) : "-"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={app.status}
                      onValueChange={(value) => handleStatusChange(app.id, value as ApplicationStatus)}
                    >
                      <SelectTrigger className="w-36 bg-white">
                        <Badge className={getStatusColor(app.status)}>
                          {getStatusLabel(app.status)}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="applied">
                          <Badge className="bg-blue-600 text-white">Applied</Badge>
                        </SelectItem>
                        <SelectItem value="phone_screen">
                          <Badge className="bg-purple-600 text-white">Phone Screen</Badge>
                        </SelectItem>
                        <SelectItem value="interview">
                          <Badge className="bg-yellow-600 text-white">Interview</Badge>
                        </SelectItem>
                        <SelectItem value="offer">
                          <Badge className="bg-green-600 text-white">Offer</Badge>
                        </SelectItem>
                        <SelectItem value="rejected">
                          <Badge className="bg-red-600 text-white">Rejected</Badge>
                        </SelectItem>
                        <SelectItem value="withdrawn">
                          <Badge className="bg-gray-600 text-white">Withdrawn</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(app.id!)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete application"
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
