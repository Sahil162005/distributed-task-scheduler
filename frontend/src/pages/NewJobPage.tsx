import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import { getApiErrorMessage } from "../utils/errors";
import type { Job, JobType } from "../types/job";

const emailRegex = /^[a-zA-Z0-9-+_.]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const NewJobPage = () => {
  const navigate = useNavigate();
  const [jobType, setJobType] = useState<JobType>("SEND_EMAIL");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [chatId, setChatId] = useState("");
  const [message, setMessage] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookMethod, setWebhookMethod] = useState<"GET" | "POST" | "PUT" | "PATCH" | "DELETE">("POST");
  const [webhookBody, setWebhookBody] = useState("");
  const [webhookHeaders, setWebhookHeaders] = useState("");
  const [healthUrl, setHealthUrl] = useState("");
  const [expectedStatus, setExpectedStatus] = useState("200");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationError = useMemo(() => {
    if (jobType === "SEND_EMAIL") {
      if (!to || !subject || !body) {
        return "Fill all the fields";
      }

      if (!emailRegex.test(to)) {
        return "Invalid Email";
      }
    }

    if (jobType === "SEND_MESSAGE") {
      if (!chatId || !message) {
        return "Fill all the fields";
      }
    }

    if (jobType === "WEBHOOK_DELIVERY") {
      if (!webhookUrl) {
        return "URL is required";
      }
    }

    if (jobType === "WEBSITE_HEALTH_CHECK") {
      if (!healthUrl) {
        return "URL is required";
      }
    }

    return null;
  }, [jobType, to, subject, body, chatId, message, webhookUrl, healthUrl]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (validationError) {
      setError(validationError);
      return;
    }

    const buildPayload = () => {
      if (jobType === "SEND_EMAIL") return { to, subject, body };
      if (jobType === "SEND_MESSAGE") return { chatId, message };
      if (jobType === "WEBHOOK_DELIVERY") {
        let parsedHeaders: Record<string, string> = {};
        try {
          parsedHeaders = webhookHeaders ? JSON.parse(webhookHeaders) : {};
        } catch {
          // ignore
        }
        return { url: webhookUrl, method: webhookMethod, headers: parsedHeaders, body: webhookBody };
      }
      if (jobType === "WEBSITE_HEALTH_CHECK") {
        return { url: healthUrl, expectedStatus: parseInt(expectedStatus, 10) || 200 };
      }
      return {};
    };

    const payload = buildPayload();

    setLoading(true);
    try {
      const response = await apiClient.post<{ job: Job }>("/api/jobs", {
        job_type: jobType,
        payload,
      });
      navigate(`/jobs/${response.data.job.id}`, { replace: true });
    } catch (err) {
      const message = getApiErrorMessage(err);
      if (message === "Unauthorized") {
        navigate("/login", { replace: true });
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <PageContainer title="Submit new job" subtitle="Choose a job type and payload to enqueue.">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <div>
            <label htmlFor="jobType" className="mb-1 block text-sm font-medium text-slate-700">
              Job Type
            </label>
            <select
              id="jobType"
              value={jobType}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => setJobType(event.target.value as JobType)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-brand-500 focus:ring"
            >
              <option value="SEND_EMAIL">SEND_EMAIL</option>
              <option value="SEND_MESSAGE">SEND_MESSAGE</option>
              <option value="WEBHOOK_DELIVERY">WEBHOOK_DELIVERY</option>
              <option value="WEBSITE_HEALTH_CHECK">WEBSITE_HEALTH_CHECK</option>
            </select>
          </div>

          {jobType === "SEND_EMAIL" && (
            <>
              <div>
                <label htmlFor="to" className="mb-1 block text-sm font-medium text-slate-700">
                  To
                </label>
                <input
                  id="to"
                  type="email"
                  value={to}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setTo(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-brand-500 focus:ring"
                />
              </div>
              <div>
                <label htmlFor="subject" className="mb-1 block text-sm font-medium text-slate-700">
                  Subject
                </label>
                <input
                  id="subject"
                  value={subject}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setSubject(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-brand-500 focus:ring"
                />
              </div>
              <div>
                <label htmlFor="body" className="mb-1 block text-sm font-medium text-slate-700">
                  Body
                </label>
                <textarea
                  id="body"
                  rows={5}
                  value={body}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setBody(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-brand-500 focus:ring"
                />
              </div>
            </>
          )}

          {jobType === "SEND_MESSAGE" && (
            <>
              <div>
                <label htmlFor="chatId" className="mb-1 block text-sm font-medium text-slate-700">
                  Chat ID
                </label>
                <input
                  id="chatId"
                  value={chatId}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setChatId(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-brand-500 focus:ring"
                />
              </div>
              <div>
                <label htmlFor="message" className="mb-1 block text-sm font-medium text-slate-700">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  value={message}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setMessage(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-brand-500 focus:ring"
                />
              </div>
            </>
          )}

          {jobType === "WEBHOOK_DELIVERY" && (
            <>
              <div>
                <label htmlFor="webhookUrl" className="mb-1 block text-sm font-medium text-slate-700">
                  Target URL
                </label>
                <input
                  id="webhookUrl"
                  type="url"
                  value={webhookUrl}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setWebhookUrl(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-brand-500 focus:ring"
                />
              </div>
              <div>
                <label htmlFor="webhookMethod" className="mb-1 block text-sm font-medium text-slate-700">
                  HTTP Method
                </label>
                <select
                  id="webhookMethod"
                  value={webhookMethod}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => setWebhookMethod(event.target.value as typeof webhookMethod)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-brand-500 focus:ring"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>PATCH</option>
                  <option>DELETE</option>
                </select>
              </div>
              <div>
                <label htmlFor="webhookBody" className="mb-1 block text-sm font-medium text-slate-700">
                  Request Body (JSON)
                </label>
                <textarea
                  id="webhookBody"
                  rows={4}
                  value={webhookBody}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setWebhookBody(event.target.value)}
                  placeholder='{"key": "value"}'
                  className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs outline-none ring-brand-500 focus:ring"
                />
              </div>
              <div>
                <label htmlFor="webhookHeaders" className="mb-1 block text-sm font-medium text-slate-700">
                  Custom Headers (JSON, optional)
                </label>
                <textarea
                  id="webhookHeaders"
                  rows={2}
                  value={webhookHeaders}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setWebhookHeaders(event.target.value)}
                  placeholder='{"Authorization": "Bearer token"}'
                  className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs outline-none ring-brand-500 focus:ring"
                />
              </div>
            </>
          )}

          {jobType === "WEBSITE_HEALTH_CHECK" && (
            <>
              <div>
                <label htmlFor="healthUrl" className="mb-1 block text-sm font-medium text-slate-700">
                  Website URL
                </label>
                <input
                  id="healthUrl"
                  type="url"
                  value={healthUrl}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setHealthUrl(event.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-brand-500 focus:ring"
                />
              </div>
              <div>
                <label htmlFor="expectedStatus" className="mb-1 block text-sm font-medium text-slate-700">
                  Expected HTTP Status
                </label>
                <input
                  id="expectedStatus"
                  type="number"
                  value={expectedStatus}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setExpectedStatus(event.target.value)}
                  placeholder="200"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-brand-500 focus:ring"
                />
              </div>
            </>
          )}

          {error ? <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-70"
          >
            {loading ? "Submitting..." : "Submit Job"}
          </button>
        </form>
      </PageContainer>
    </>
  );
};

export default NewJobPage;
