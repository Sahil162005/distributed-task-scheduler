import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import StatusBadge from "../components/StatusBadge";
import { apiClient } from "../api/client";
import { onJobUpdate, subscribeToJob } from "../lib/socket";
import type { Job, JobStatusEvent } from "../types/job";
import { getApiErrorMessage } from "../utils/errors";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingListEndpoint, setMissingListEndpoint] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchJobs = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<{ jobs?: Job[] } | Job[]>("/api/jobs");
        if (!mounted) {
          return;
        }

        const fetchedJobs = Array.isArray(response.data) ? response.data : response.data.jobs ?? [];
        setJobs(fetchedJobs);
        setMissingListEndpoint(false);
      } catch (err) {
        if (!mounted) {
          return;
        }

        const message = getApiErrorMessage(err);
        if (message === "Unauthorized") {
          navigate("/login", { replace: true });
          return;
        }

        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 404) {
          setMissingListEndpoint(true);
          setJobs([]);
        } else {
          setError(message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void fetchJobs();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    jobs.forEach((job) => subscribeToJob(job.id));
  }, [jobs]);

  useEffect(() => {
    const unsubscribe = onJobUpdate((event: JobStatusEvent) => {
      setJobs((currentJobs: Job[]) =>
        currentJobs.map((job: Job) => {
          if (job.id !== event.jobId) {
            return job;
          }

          return {
            ...job,
            status: event.status,
            retry_count: event.retryCount,
            error: event.error,
            result: event.result,
            started_at: event.startedAt,
            completed_at: event.completedAt,
          };
        })
      );
    });

    return unsubscribe;
  }, []);

  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [jobs]
  );

  return (
    <>
      <Navbar />
      <PageContainer title="Dashboard" subtitle="Track your background jobs in real time.">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Your Jobs</h2>
          <Link
            to="/jobs/new"
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500"
          >
            Submit Job
          </Link>
        </div>

        {loading ? <p className="text-sm text-slate-600">Loading jobs...</p> : null}
        {error ? <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}

        {missingListEndpoint ? (
          <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
            `GET /api/jobs` is not available on backend yet. Ask backend to add this endpoint.
          </div>
        ) : null}

        {!loading && !error && !missingListEndpoint && sortedJobs.length === 0 ? (
          <p className="text-sm text-slate-600">No jobs yet. Submit your first job.</p>
        ) : null}

        {!loading && !missingListEndpoint && sortedJobs.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedJobs.map((job) => (
                  <tr key={job.id}>
                    <td className="px-4 py-3 text-sm text-slate-800">{job.job_type}</td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link to={`/jobs/${job.id}`} className="font-medium text-brand-600 hover:underline">
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </PageContainer>
    </>
  );
};

export default DashboardPage;
