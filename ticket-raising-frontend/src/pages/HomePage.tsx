import { useNavigate } from "react-router-dom";

function QuickCard({
  title,
  desc,
  actionLabel,
  onClick,
}: {
  title: string;
  desc: string;
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
      <button className="btn-primary mt-4" onClick={onClick}>
        {actionLabel}
      </button>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create and track tickets faster with clean details and attachments.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <QuickCard
          title="Mobile Device Ticket"
          desc="Device model, OS type/version, screenshots, and exact issue description."
          actionLabel="Go to Mobile Devices"
          onClick={() => navigate("/app/mobile")}
        />
        <QuickCard
          title="Virtual Machine Ticket"
          desc="VM name, IP, username and issue details. Attach logs/screenshots."
          actionLabel="Go to Virtual Machines"
          onClick={() => navigate("/app/vm")}
        />
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900">Good ticket checklist</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold">Clear Summary</div>
            <div className="mt-1 text-xs text-slate-600">What is broken and what you expected.</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold">Repro Steps</div>
            <div className="mt-1 text-xs text-slate-600">Steps to reproduce the issue.</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold">Evidence</div>
            <div className="mt-1 text-xs text-slate-600">Screenshots / logs as attachments.</div>
          </div>
        </div>
      </div>
    </div>
  );
}