import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { BellRing, Mail, Send, Stethoscope, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/axios";
import type { Job, JobType } from "../types/job";

type HeaderRow = {
  key: string;
  value: string;
};

type JobSubmissionPanelProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (job: Job) => void;
};

const jobTypeCards: Array<{ type: JobType; title: string; description: string; icon: JSX.Element }> = [
  {
    type: "SEND_EMAIL",
    title: "Send Email",
    description: "Dispatch transactional or alert emails.",
    icon: <Mail size={18} />,
  },
  {
    type: "SEND_MESSAGE",
    title: "Send Message",
    description: "Deliver a Telegram message to a chat.",
    icon: <Send size={18} />,
  },
  {
    type: "WEBHOOK_DELIVERY",
    title: "Webhook Delivery",
    description: "Call an external webhook endpoint.",
    icon: <BellRing size={18} />,
  },
  {
    type: "WEBSITE_HEALTH_CHECK",
    title: "Website Health Check",
    description: "Verify endpoint availability and status.",
    icon: <Stethoscope size={18} />,
  },
];

const isValidEmail = (value: string) => /^[a-zA-Z0-9-+_.]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);

const isValidHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const JobSubmissionPanel = ({ open, onClose, onCreated }: JobSubmissionPanelProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [jobType, setJobType] = useState<JobType>("SEND_EMAIL");
  const [submitting, setSubmitting] = useState(false);

  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [chatId, setChatId] = useState("");
  const [message, setMessage] = useState("");

  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookMethod, setWebhookMethod] = useState<"POST" | "PUT" | "PATCH">("POST");
  const [webhookBody, setWebhookBody] = useState("{}");
  const [headers, setHeaders] = useState<HeaderRow[]>([{ key: "", value: "" }]);

  const [healthUrl, setHealthUrl] = useState("");
  const [expectedStatus, setExpectedStatus] = useState("200");

  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep(1);
    setJobType("SEND_EMAIL");
    setSubmitting(false);
    setEmailTo("");
    setEmailSubject("");
    setEmailBody("");
    setChatId("");
    setMessage("");
    setWebhookUrl("");
    setWebhookMethod("POST");
    setWebhookBody("{}");
    setHeaders([{ key: "", value: "" }]);
    setHealthUrl("");
    setExpectedStatus("200");
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const payload = useMemo(() => {
    if (jobType === "SEND_EMAIL") {
      return {
        payload: {
          to: emailTo.trim(),
          subject: emailSubject.trim(),
          body: emailBody.trim(),
        },
      };
    }

    if (jobType === "SEND_MESSAGE") {
      return {
        payload: {
          chatId: chatId.trim(),
          message: message.trim(),
        },
      };
    }

    if (jobType === "WEBHOOK_DELIVERY") {
      const mappedHeaders = headers.reduce<Record<string, string>>((acc, row) => {
        if (row.key.trim()) {
          acc[row.key.trim()] = row.value;
        }
        return acc;
      }, {});

      return {
        payload: {
          url: webhookUrl.trim(),
          method: webhookMethod,
          headers: mappedHeaders,
          body: webhookBody,
        },
      };
    }

    return {
      payload: {
        url: healthUrl.trim(),
        expectedStatus: Number(expectedStatus) || 200,
      },
    };
  }, [
    chatId,
    emailBody,
    emailSubject,
    emailTo,
    expectedStatus,
    headers,
    healthUrl,
    jobType,
    message,
    webhookBody,
    webhookMethod,
    webhookUrl,
  ]);

  const validate = () => {
    if (jobType === "SEND_EMAIL") {
      if (!emailTo.trim() || !emailSubject.trim() || !emailBody.trim()) {
        return "Fill all the fields";
      }
      if (!isValidEmail(emailTo.trim())) {
        return "Invalid Email";
      }
    }

    if (jobType === "SEND_MESSAGE") {
      if (!chatId.trim() || !message.trim()) {
        return "Fill all the fields";
      }
    }

    if (jobType === "WEBHOOK_DELIVERY") {
      if (!webhookUrl.trim()) {
        return "URL is required";
      }
      if (!isValidHttpUrl(webhookUrl.trim())) {
        return "Webhook URL must be valid";
      }
      try {
        JSON.parse(webhookBody);
      } catch {
        return "Webhook body must be valid JSON";
      }
    }

    if (jobType === "WEBSITE_HEALTH_CHECK") {
      if (!healthUrl.trim()) {
        return "URL is required";
      }
      if (!isValidHttpUrl(healthUrl.trim())) {
        return "Health check URL must be valid";
      }
    }

    return null;
  };

  const addHeaderRow = () => setHeaders((current) => [...current, { key: "", value: "" }]);

  const updateHeaderRow = (index: number, next: HeaderRow) => {
    setHeaders((current) => current.map((row, i) => (i === index ? next : row)));
  };

  const removeHeaderRow = (index: number) => {
    setHeaders((current) => {
      const filtered = current.filter((_, i) => i !== index);
      return filtered.length ? filtered : [{ key: "", value: "" }];
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post<{ job: Job }>("/api/jobs", {
        job_type: jobType,
        payload: payload.payload,
      });

      toast.success("Job submitted successfully");
      onCreated(response.data.job);
      close();
    } catch (err) {
      const messageText = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      const safeMessage = messageText || "Failed to submit job";
      setError(safeMessage);
      toast.error(safeMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={close} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-slate-700 bg-slate-900 p-5 shadow-2xl sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Submit New Job</h2>
            <p className="mt-1 text-sm text-slate-300">Create and dispatch work to distributed workers.</p>
          </div>
          <button type="button" onClick={close} className="btn-secondary px-3 py-2">
            <X size={16} />
          </button>
        </div>

        <div className="mb-5 rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-sm text-slate-300">
          <span className="font-semibold text-violet-300">Step {step}</span>
          <span className="ml-2">{step === 1 ? "Choose a job type" : "Provide payload details"}</span>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {step === 1 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {jobTypeCards.map((card) => {
                const selected = jobType === card.type;
                return (
                  <button
                    type="button"
                    key={card.type}
                    onClick={() => setJobType(card.type)}
                    className={`rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-slate-700 bg-slate-800/60 hover:border-slate-500"
                    }`}
                  >
                    <div className="mb-2 inline-flex rounded-lg bg-slate-900/70 p-2 text-violet-300">{card.icon}</div>
                    <h3 className="font-semibold text-slate-100">{card.title}</h3>
                    <p className="mt-1 text-xs text-slate-300">{card.description}</p>
                  </button>
                );
              })}
            </div>
          ) : null}

          {step === 2 && jobType === "SEND_EMAIL" ? (
            <>
              <input className="field" placeholder="To email" value={emailTo} onChange={(event) => setEmailTo(event.target.value)} />
              <input
                className="field"
                placeholder="Subject"
                value={emailSubject}
                onChange={(event) => setEmailSubject(event.target.value)}
              />
              <textarea
                className="field min-h-28"
                placeholder="Email body"
                value={emailBody}
                onChange={(event) => setEmailBody(event.target.value)}
              />
            </>
          ) : null}

          {step === 2 && jobType === "SEND_MESSAGE" ? (
            <>
              <div>
                <input className="field" placeholder="Chat ID" value={chatId} onChange={(event) => setChatId(event.target.value)} />
                <p className="mt-1 text-xs text-slate-400">Your Telegram chat ID</p>
              </div>
              <textarea
                className="field min-h-28"
                placeholder="Message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </>
          ) : null}

          {step === 2 && jobType === "WEBHOOK_DELIVERY" ? (
            <>
              <input
                className="field"
                placeholder="Webhook URL"
                value={webhookUrl}
                onChange={(event) => setWebhookUrl(event.target.value)}
              />
              <select
                className="field"
                value={webhookMethod}
                onChange={(event) => setWebhookMethod(event.target.value as "POST" | "PUT" | "PATCH")}
              >
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
              </select>

              <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-200">Headers</p>
                  <button type="button" onClick={addHeaderRow} className="text-xs font-semibold text-violet-300 hover:text-violet-200">
                    + Add header
                  </button>
                </div>
                {headers.map((row, index) => (
                  <div key={`${index}-${row.key}`} className="flex gap-2">
                    <input
                      className="field"
                      placeholder="Key"
                      value={row.key}
                      onChange={(event) => updateHeaderRow(index, { ...row, key: event.target.value })}
                    />
                    <input
                      className="field"
                      placeholder="Value"
                      value={row.value}
                      onChange={(event) => updateHeaderRow(index, { ...row, value: event.target.value })}
                    />
                    <button type="button" onClick={() => removeHeaderRow(index)} className="btn-secondary px-3 py-2">
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <textarea
                  className="field min-h-32 font-mono text-xs"
                  placeholder='{"key":"value"}'
                  value={webhookBody}
                  onChange={(event) => setWebhookBody(event.target.value)}
                />
                <p className="mt-1 text-xs text-slate-400">Body should be valid JSON.</p>
              </div>
            </>
          ) : null}

          {step === 2 && jobType === "WEBSITE_HEALTH_CHECK" ? (
            <>
              <input
                className="field"
                placeholder="URL to monitor"
                value={healthUrl}
                onChange={(event) => setHealthUrl(event.target.value)}
              />
              <input
                className="field"
                placeholder="Expected status"
                type="number"
                value={expectedStatus}
                onChange={(event) => setExpectedStatus(event.target.value)}
              />
            </>
          ) : null}

          {error ? <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            {step === 2 ? (
              <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                Back
              </button>
            ) : null}

            {step === 1 ? (
              <button type="button" className="btn-primary" onClick={() => setStep(2)}>
                Continue
              </button>
            ) : (
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Job"}
              </button>
            )}
          </div>
        </form>
      </aside>
    </div>
  );
};

export default JobSubmissionPanel;
