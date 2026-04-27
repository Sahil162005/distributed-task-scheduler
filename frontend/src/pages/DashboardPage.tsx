import { useEffect, useMemo, useState } from "react";
import { BarChart3, CirclePlus, Database, ListChecks, TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import EmptyState from "../components/EmptyState";
import JobSubmissionPanel from "../components/JobSubmissionPanel";
import LoadingSkeleton from "../components/LoadingSkeleton";
import PageContainer from "../components/PageContainer";
import StatusBadge from "../components/StatusBadge";
import api from "../lib/axios";
import { connectSocket, onJobUpdate, subscribeToJob } from "../lib/socket";
import type { Job, JobStatusEvent } from "../types/job";
import { getApiErrorMessage } from "../utils/errors";

type Stats = {
  total: number;
  completed: number;
  failed: number;
  processing: number;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJobPanel, setShowJobPanel] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<{ jobs?: Job[] } | Job[]>("/api/jobs");
      const fetchedJobs = Array.isArray(response.data) ? response.data : response.data.jobs ?? [];
      setJobs(fetchedJobs);
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      toast.error(message);

      if (message === "Unauthorized") {
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchJobs();
  }, [navigate]);

  useEffect(() => {
    connectSocket();
  }, [navigate]);

  useEffect(() => {
    jobs.forEach((job) => subscribeToJob(job.id));
  }, [jobs]);

  useEffect(() => {
    const unsubscribe = onJobUpdate((event: JobStatusEvent) => {
      setJobs((currentJobs: Job[]) => {
        let found = false;
        const next = currentJobs.map((job: Job) => {
          if (job.id !== event.jobId) {
            return job;
          }

          found = true;

          return {
            ...job,
            status: event.status,
            retry_count: event.retryCount,
            error: event.error,
            result: event.result,
            started_at: event.startedAt,
            completed_at: event.completedAt,
          };
        });

        return found ? next : currentJobs;
      });
    });

    return unsubscribe;
  }, []);

  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [jobs]
  );

  const stats: Stats = useMemo(
    () => ({
      total: jobs.length,
      completed: jobs.filter((job) => job.status === "COMPLETED").length,
      failed: jobs.filter((job) => job.status === "FAILED").length,
      processing: jobs.filter((job) => job.status === "PROCESSING" || job.status === "PENDING").length,
    }),
    [jobs]
  );

  const chartData = useMemo(
    () => [
      { name: "Pending", value: jobs.filter((job) => job.status === "PENDING").length, color: "#94a3b8" },
      { name: "Processing", value: jobs.filter((job) => job.status === "PROCESSING").length, color: "#3b82f6" },
      { name: "Retrying", value: jobs.filter((job) => job.status === "RETRYING").length, color: "#f59e0b" },
      { name: "Completed", value: jobs.filter((job) => job.status === "COMPLETED").length, color: "#10b981" },
      { name: "Failed", value: jobs.filter((job) => job.status === "FAILED").length, color: "#f43f5e" },
    ],
    [jobs]
  );

  const createFromPanel = (job: Job) => {
    setJobs((current) => [job, ...current]);
  };

  return (
    <>
      <Navbar />
      <PageContainer title="Dashboard" subtitle="Track all task executions and submit new work instantly.">
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="glass-card p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Total Jobs</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-bold text-slate-100">{stats.total}</p>
              <Database className="text-violet-300" size={18} />
            </div>
          </article>
          <article className="glass-card p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Completed</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-bold text-emerald-300">{stats.completed}</p>
              <ListChecks className="text-emerald-300" size={18} />
            </div>
          </article>
          <article className="glass-card p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Failed</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-bold text-rose-300">{stats.failed}</p>
              <TriangleAlert className="text-rose-300" size={18} />
            </div>
          </article>
          <article className="glass-card p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Pending/Processing</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-bold text-blue-300">{stats.processing}</p>
              <BarChart3 className="text-blue-300" size={18} />
            </div>
          </article>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className="glass-card overflow-hidden p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Recent Jobs</h2>
                <p className="text-sm text-slate-400">Latest tasks with live status updates.</p>
              </div>
              <button type="button" onClick={() => setShowJobPanel(true)} className="btn-primary gap-2">
                <CirclePlus size={16} /> Submit New Job
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                <LoadingSkeleton className="h-12" />
                <LoadingSkeleton className="h-12" />
                <LoadingSkeleton className="h-12" />
                <LoadingSkeleton className="h-12" />
              </div>
            ) : null}

            {error && !loading ? (
              <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>
            ) : null}

            {!loading && !error && sortedJobs.length === 0 ? (
              <EmptyState
                title="No jobs yet"
                description="Submit your first job to start processing distributed workloads."
                action={
                  <button type="button" className="btn-primary" onClick={() => setShowJobPanel(true)}>
                    Submit your first job
                  </button>
                }
              />
            ) : null}

            {!loading && sortedJobs.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-slate-700">
                <table className="min-w-full">
                  <thead className="bg-slate-900/80">
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-3">Job ID</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created At</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedJobs.map((job) => (
                      <tr
                        key={job.id}
                        className="cursor-pointer border-t border-slate-700 bg-slate-900/35 transition hover:bg-slate-800/60"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-slate-300">{`${job.id.slice(0, 8)}...`}</td>
                        <td className="px-4 py-3 text-sm text-slate-100">{job.job_type}</td>
                        <td className="px-4 py-3 text-sm">
                          <StatusBadge status={job.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">{new Date(job.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-violet-300">View</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>

          <section className="glass-card p-4 sm:p-5">
            <h3 className="text-base font-semibold text-slate-100">Job Status Distribution</h3>
            <p className="mt-1 text-sm text-slate-400">Current status mix across your queue.</p>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: "rgba(51, 65, 85, 0.35)" }} contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "12px" }} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </PageContainer>

      <JobSubmissionPanel open={showJobPanel} onClose={() => setShowJobPanel(false)} onCreated={createFromPanel} />
    </>
  );
};

export default DashboardPage;
