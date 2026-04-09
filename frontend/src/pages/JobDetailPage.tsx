import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../api/client";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import StatusBadge from "../components/StatusBadge";
import { onJobUpdate, subscribeToJob } from "../lib/socket";
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
        const response = await apiClient.get<{ job: Job }>(`/api/jobs/${id}`);
        if (!mounted) {
          return;
        }

        setJob(response.data.job);
      } catch (err) {
        if (!mounted) {
          return;
        }

        const message = getApiErrorMessage(err);
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

  return (
    <>
      <Navbar />
      <PageContainer title="Job details" subtitle="Live status updates are reflected automatically.">
        <div className="mb-4">
          <Link to="/dashboard" className="text-sm font-medium text-brand-600 hover:underline">
            ← Back to dashboard
          </Link>
        </div>

        {loading ? <p className="text-sm text-slate-600">Loading job...</p> : null}
        {error ? <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}

        {!loading && job ? (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{job.job_type}</h2>
              <StatusBadge status={job.status} />
            </div>

            <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="font-medium text-slate-600">Job ID</dt>
                <dd className="text-slate-900">{job.id}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">Retry Count</dt>
                <dd className="text-slate-900">{job.retry_count} / {job.max_retries}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">Created At</dt>
                <dd className="text-slate-900">{new Date(job.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">Started At</dt>
                <dd className="text-slate-900">{job.started_at ? new Date(job.started_at).toLocaleString() : "-"}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">Completed At</dt>
                <dd className="text-slate-900">
                  {job.completed_at ? new Date(job.completed_at).toLocaleString() : "-"}
                </dd>
              </div>
            </dl>

            <div>
              <h3 className="mb-1 text-sm font-medium text-slate-700">Payload</h3>
              <pre className="overflow-auto rounded-md bg-slate-50 p-3 text-xs text-slate-800">
                {JSON.stringify(job.payload, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="mb-1 text-sm font-medium text-slate-700">Result</h3>
              <pre className="overflow-auto rounded-md bg-slate-50 p-3 text-xs text-slate-800">
                {JSON.stringify(job.result, null, 2)}
              </pre>
            </div>

            {job.error ? (
              <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{job.error}</p>
            ) : null}
          </div>
        ) : null}
      </PageContainer>
    </>
  );
};

export default JobDetailPage;
