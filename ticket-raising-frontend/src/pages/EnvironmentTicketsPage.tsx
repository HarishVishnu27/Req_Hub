import { memo, useCallback, useMemo, useState } from "react";
import Button from "../components/Button";
import { apiFetch, type ApiError } from "../api/http";
import { getAuth } from "../auth/authStore";

type TicketResponse = {
  ticket: {
    ticket_id: string;
  };
};

const EnvironmentTicketModal = memo(function EnvironmentTicketModal({
  open,
  loading,
  userEmail,
  url,
  problemDescription,
  files,
  formErr,
  onClose,
  onSubmit,
  setUrl,
  setProblemDescription,
  onFilesPicked,
  onClearFiles,
}: {
  open: boolean;
  loading: boolean;
  userEmail: string;
  url: string;
  problemDescription: string;
  files: FileList | null;
  formErr: string | null;
  onClose: () => void;
  onSubmit: () => void;
  setUrl: (v: string) => void;
  setProblemDescription: (v: string) => void;
  onFilesPicked: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFiles: () => void;
}) {
  const fileItems = useMemo(() => {
    if (!files) return [];
    return Array.from(files).map((f) => ({
      name: f.name,
      sizeKb: Math.ceil(f.size / 1024),
    }));
  }, [files]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="card w-full max-w-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Raise Environment Ticket
              </div>
              <div className="mt-1 text-xs text-slate-600">User: {userEmail}</div>
            </div>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Close
            </Button>
          </div>

          <div className="p-5 space-y-4">
            {formErr ? <div className="banner-error">{formErr}</div> : null}

            <div className="grid grid-cols-1 gap-4">
              <label className="block">
                <span className="label">URL</span>
                <input
                  className="input"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/app"
                />
              </label>

              <label className="block">
                <span className="label">Problem description</span>
                <textarea
                  className="input min-h-[140px]"
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Describe the issue (not responding, error message, time, steps)..."
                />
              </label>

              <div className="block">
                <span className="label">Attachments</span>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <label className="btn-secondary cursor-pointer rounded-full px-4 py-2">
                    Choose files
                    <input className="hidden" type="file" multiple onChange={onFilesPicked} />
                  </label>

                  <button
                    type="button"
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    onClick={onClearFiles}
                    disabled={!files || loading}
                  >
                    Clear
                  </button>

                  {!files ? (
                    <span className="text-xs text-slate-500">No files selected</span>
                  ) : (
                    <span className="text-xs text-slate-600">
                      {fileItems.length} file(s) selected
                    </span>
                  )}
                </div>

                {fileItems.length ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-700">Selected files</div>
                    <ul className="mt-2 space-y-1 text-xs text-slate-600">
                      {fileItems.map((f) => (
                        <li key={f.name} className="flex items-center justify-between gap-3">
                          <span className="truncate">{f.name}</span>
                          <span className="shrink-0">{f.sizeKb} KB</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-500">Optional: screenshots/logs</div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={onSubmit} disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function EnvironmentTicketsPage() {
  const auth = getAuth();
  const userEmail = auth?.user?.email ?? "";

  const [open, setOpen] = useState(false);

  const [url, setUrl] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const [loading, setLoading] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [pageErr, setPageErr] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setUrl("");
    setProblemDescription("");
    setFiles(null);
    setFormErr(null);
  }, []);

  const onClose = useCallback(() => {
    if (loading) return;
    setOpen(false);
    setFormErr(null);
  }, [loading]);

  const onClearFiles = useCallback(() => {
    setFiles(null);
    setFormErr(null);
  }, []);

  const onFilesPicked = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) {
      setFiles(null);
      return;
    }
    setFiles(selected);
  }, []);

  const onSubmit = useCallback(async () => {
    setMsg(null);
    setPageErr(null);
    setFormErr(null);

    if (!userEmail) return setFormErr("User email is missing. Please login again.");
    if (!url.trim()) return setFormErr("URL is required.");
    if (!problemDescription.trim()) return setFormErr("Problem description is required.");

    setLoading(true);
    try {
      const fd = new FormData();
      //fd.append("user_id", userEmail);
      fd.append("url", url);
      fd.append("problem_description", problemDescription);

      if (files) Array.from(files).forEach((f) => fd.append("files", f));

      const res = await apiFetch<TicketResponse>("/tickets/create_environment_ticket", {
        method: "POST",
        body: fd,
      });

      setMsg(`Environment ticket created: ${res.ticket.ticket_id}`);
      setOpen(false);
      resetForm();
    } catch (e) {
      const apiErr = e as ApiError;
      setFormErr(apiErr.detail || "Failed to create environment ticket.");
    } finally {
      setLoading(false);
    }
  }, [files, problemDescription, resetForm, url, userEmail]);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Environment</h1>
            <p className="mt-1 text-sm text-slate-600">
              Use this when an environment/website is not responding.
            </p>
          </div>
          <Button onClick={() => setOpen(true)} disabled={!userEmail}>
            Raise Ticket
          </Button>
        </div>

        {msg ? <div className="mt-4 banner-success">{msg}</div> : null}
        {pageErr ? <div className="mt-4 banner-error">{pageErr}</div> : null}
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900">Tips</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-600 space-y-1">
          <li>Include exact URL and time of issue.</li>
          <li>Attach screenshot of error / logs if possible.</li>
          <li>Mention steps to reproduce.</li>
        </ul>
      </div>

      <EnvironmentTicketModal
        open={open}
        loading={loading}
        userEmail={userEmail}
        url={url}
        problemDescription={problemDescription}
        files={files}
        formErr={formErr}
        onClose={onClose}
        onSubmit={onSubmit}
        setUrl={setUrl}
        setProblemDescription={setProblemDescription}
        onFilesPicked={onFilesPicked}
        onClearFiles={onClearFiles}
      />
    </div>
  );
}