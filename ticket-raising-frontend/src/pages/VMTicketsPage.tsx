import { memo, useCallback, useMemo, useState } from "react";
import Button from "../components/Button";
import { apiFetch, type ApiError } from "../api/http";
import { getAuth } from "../auth/authStore";

type TicketResponse = {
  ticket: {
    ticket_id: string;
  };
};

function formatKb(bytes: number) {
  return Math.ceil(bytes / 1024);
}

const VMTicketModal = memo(function VMTicketModal({
  open,
  loading,
  userEmail,
  vmName,
  vmIp,
  vmUsername,
  osType,
  problemDescription,
  files,
  formErr,
  onClose,
  onSubmit,
  setVmName,
  setVmIp,
  setVmUsername,
  setOsType,
  setProblemDescription,
  onFilesPicked,
  onClearFiles,
}: {
  open: boolean;
  loading: boolean;
  userEmail: string;
  vmName: string;
  vmIp: string;
  vmUsername: string;
  osType: string;
  problemDescription: string;
  files: FileList | null;
  formErr: string | null;
  onClose: () => void;
  onSubmit: () => void;
  setVmName: (v: string) => void;
  setVmIp: (v: string) => void;
  setVmUsername: (v: string) => void;
  setOsType: (v: string) => void;
  setProblemDescription: (v: string) => void;
  onFilesPicked: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFiles: () => void;
}) {
  const fileItems = useMemo(() => {
    if (!files) return [];
    return Array.from(files).map((f) => ({
      name: f.name,
      sizeKb: formatKb(f.size),
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
              <div className="text-sm font-semibold text-slate-900">Raise VM Ticket</div>
              <div className="mt-1 text-xs text-slate-600">User: {userEmail}</div>
            </div>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Close
            </Button>
          </div>

          <div className="p-5 space-y-4">
            {formErr ? <div className="banner-error">{formErr}</div> : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">VM name</span>
                <input
                  className="input"
                  value={vmName}
                  onChange={(e) => setVmName(e.target.value)}
                  placeholder="dev-vm-01"
                />
              </label>

              <label className="block">
                <span className="label">VM IP</span>
                <input
                  className="input"
                  value={vmIp}
                  onChange={(e) => setVmIp(e.target.value)}
                  placeholder="10.0.0.10"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="label">VM username</span>
                <input
                  className="input"
                  value={vmUsername}
                  onChange={(e) => setVmUsername(e.target.value)}
                  placeholder="ubuntu / admin / ec2-user ..."
                />
              </label>

              {/* ✅ NEW: OS Type */}
              <label className="block sm:col-span-2">
                <span className="label">OS Type</span>
                <select className="input" value={osType} onChange={(e) => setOsType(e.target.value)}>
                  <option value="Windows">Windows</option>
                  <option value="Linux">Linux</option>
                  <option value="Mac">Mac</option>
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="label">Problem description</span>
                <textarea
                  className="input min-h-[120px]"
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Describe the issue clearly..."
                />
              </label>

              <div className="block sm:col-span-2">
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
                    <span className="text-xs text-slate-600">{fileItems.length} file(s) selected</span>
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

export default function VMTicketsPage() {
  const auth = getAuth();
  const userEmail = auth?.user?.email ?? "";

  const [open, setOpen] = useState(false);

  const [vmName, setVmName] = useState("");
  const [vmIp, setVmIp] = useState("");
  const [vmUsername, setVmUsername] = useState("");

  // ✅ NEW
  const [osType, setOsType] = useState<"Windows" | "Linux" | "Mac">("Windows");

  const [problemDescription, setProblemDescription] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const [loading, setLoading] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [pageErr, setPageErr] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setVmName("");
    setVmIp("");
    setVmUsername("");
    setOsType("Windows");
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
    if (!vmName.trim()) return setFormErr("VM name is required.");
    if (!vmIp.trim()) return setFormErr("VM IP is required.");
    if (!vmUsername.trim()) return setFormErr("VM username is required.");
    if (!osType.trim()) return setFormErr("OS Type is required.");
    if (!problemDescription.trim()) return setFormErr("Problem description is required.");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("vm_name", vmName);
      fd.append("vm_ip", vmIp);
      fd.append("vm_username", vmUsername);
      fd.append("os_type", osType); // ✅ NEW
      fd.append("problem_description", problemDescription);

      if (files) Array.from(files).forEach((f) => fd.append("files", f));

      const res = await apiFetch<TicketResponse>("/tickets/create_vm_ticket", {
        method: "POST",
        body: fd,
      });

      setMsg(`VM ticket created: ${res.ticket.ticket_id}`);
      setOpen(false);
      resetForm();
    } catch (e) {
      const apiErr = e as ApiError;
      setFormErr(apiErr.detail || "Failed to create VM ticket.");
    } finally {
      setLoading(false);
    }
  }, [files, osType, problemDescription, resetForm, userEmail, vmIp, vmName, vmUsername]);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Virtual Machines</h1>
            <p className="mt-1 text-sm text-slate-600">
              Create a VM ticket with IP, username, OS type and issue details.
            </p>
          </div>
          <Button
            onClick={() => {
              setOpen(true);
              setFormErr(null);
              setPageErr(null);
            }}
            disabled={!userEmail}
          >
            Raise Ticket
          </Button>
        </div>

        {msg ? <div className="mt-4 banner-success">{msg}</div> : null}
        {pageErr ? <div className="mt-4 banner-error">{pageErr}</div> : null}
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900">Tips</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-600 space-y-1">
          <li>Confirm IP and username are correct.</li>
          <li>Select the correct OS type.</li>
          <li>Attach screenshots/logs where possible.</li>
        </ul>
      </div>

      <VMTicketModal
        open={open}
        loading={loading}
        userEmail={userEmail}
        vmName={vmName}
        vmIp={vmIp}
        vmUsername={vmUsername}
        osType={osType}
        problemDescription={problemDescription}
        files={files}
        formErr={formErr}
        onClose={onClose}
        onSubmit={onSubmit}
        setVmName={setVmName}
        setVmIp={setVmIp}
        setVmUsername={setVmUsername}
        setOsType={(v) => setOsType(v as any)}
        setProblemDescription={setProblemDescription}
        onFilesPicked={onFilesPicked}
        onClearFiles={onClearFiles}
      />
    </div>
  );
}