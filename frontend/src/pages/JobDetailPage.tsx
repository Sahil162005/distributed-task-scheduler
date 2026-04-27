import { useEffect, useState } from "react";
import { ArrowLeft, Clock3, FileJson2, PlayCircle, ShieldAlert } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import PageContainer from "../components/PageContainer";
import StatusBadge from "../components/StatusBadge";
import api from "../lib/axios";
import { connectSocket, onJobUpdate, subscribeToJob } from "../lib/socket";
import type { Job, JobStatusEvent } from "../types/job";
import { getApiErrorMessage } from "../utils/errors";

const JobDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Job id is missing");
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchJob = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<{ job: Job }>(`/api/jobs/${id}`);
        if (!mounted) {
          return;
        }

        setJob(response.data.job);
      } catch (err) {
        if (!mounted) {
          return;
        }

        const message = getApiErrorMessage(err);
        toast.error(message);
        if (message === "Unauthorized") {
          navigate("/login", { replace: true });
          return;
        }

        setError(message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void fetchJob();

    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  useEffect(() => {
    if (!id) {
      return;
    }

    connectSocket();
    subscribeToJob(id);

    const unsubscribe = onJobUpdate((event: JobStatusEvent) => {
      if (event.jobId !== id) {
        return;
      }

      setJob((currentJob: Job | null) => {
        if (!currentJob) {
          return currentJob;
        }

        return {
          ...currentJob,
          status: event.status,
          retry_count: event.retryCount,
          error: event.error,
          result: event.result,
          started_at: event.startedAt,
          completed_at: event.completedAt,
        };
      });
    });

    return unsubscribe;
  }, [id]);

  const timeline = [
    {
      title: "Job Created",
      timestamp: job?.created_at,
      icon: <Clock3 size={16} />,
      show: true,
    },
    {
      title: "Processing Started",
      timestamp: job?.started_at,
      icon: <PlayCircle size={16} />,
      show: Boolean(job?.started_at),
    },
    {
      title: job?.status === "FAILED" ? "Job Failed" : "Job Completed",
      timestamp: job?.completed_at,
      icon: job?.status === "FAILED" ? <ShieldAlert size={16} /> : <FileJson2 size={16} />,
      show: Boolean(job?.completed_at),
    },
  ].filter((item) => item.show);

  return (
    <>
      <Navbar />
      <PageContainer title="Job Details" subtitle="Observe status updates and execution metadata in real time.">
        <div className="mb-5">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-violet-200">
            <ArrowLeft size={14} /> Back to dashboard
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <LoadingSkeleton className="h-72" />
            <LoadingSkeleton className="h-72" />
          </div>
        ) : null}

        {error ? (
          <EmptyState
            title="Unable to load job"
            description={error}
            icon={<ShieldAlert size={32} />}
            action={
              <button type="button" className="btn-primary" onClick={() => navigate("/dashboard") }>
                Back to dashboard
              </button>
            }
          />
        ) : null}

        {!loading && job ? (
          <div className="space-y-5">
            <section className="glass-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-100">{job.job_type}</h2>
                <StatusBadge status={job.status} large />
              </div>
              <p className="mt-2 text-sm text-slate-300">Job ID: <span className="font-mono text-xs">{job.id}</span></p>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <article className="glass-card p-5">
                <h3 className="mb-4 text-base font-semibold text-slate-100">Execution Info</h3>
                <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-slate-400">Type</dt>
                    <dd className="mt-1 text-slate-100">{job.job_type}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Retry Count</dt>
                    <dd className="mt-1 text-slate-100">
                      {job.retry_count} / {job.max_retries}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Created At</dt>
                    <dd className="mt-1 text-slate-100">{new Date(job.created_at).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Started At</dt>
                    <dd className="mt-1 text-slate-100">{job.started_at ? new Date(job.started_at).toLocaleString() : "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Completed At</dt>
                    <dd className="mt-1 text-slate-100">{job.completed_at ? new Date(job.completed_at).toLocaleString() : "-"}</dd>
                  </div>
                </dl>
              </article>

              <article className="glass-card p-5">
                <h3 className="mb-4 text-base font-semibold text-slate-100">Output</h3>
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Payload</p>
                    <pre className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-200">
                      {JSON.stringify(job.payload, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Result</p>
                    <pre className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-200">
                      {JSON.stringify(job.result, null, 2)}
                    </pre>
                  </div>
                  {job.error ? <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{job.error}</p> : null}
                </div>
              </article>
            </section>

            <section className="glass-card p-5">
              <h3 className="mb-4 text-base font-semibold text-slate-100">Timeline</h3>
              <ol className="space-y-3">
                {timeline.map((item, index) => (
                  <li key={`${item.title}-${index}`} className="flex items-start gap-3">
                    <span className="mt-1 rounded-full border border-slate-600 bg-slate-900 p-1.5 text-violet-300">{item.icon}</span>
                    <div>
                      <p className="font-medium text-slate-100">{item.title}</p>
                      <p className="text-sm text-slate-400">{item.timestamp ? new Date(item.timestamp).toLocaleString() : "-"}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        ) : null}
      </PageContainer>
    </>
  );
};

export default JobDetailPage;
