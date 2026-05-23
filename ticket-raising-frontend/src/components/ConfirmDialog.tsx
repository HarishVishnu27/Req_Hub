import Button from "./Button";

export default function ConfirmDialog({
  open,
  title = "Confirm",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => !loading && onCancel()}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="card w-full max-w-md overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div className="text-sm font-semibold text-slate-900">{title}</div>
          </div>
          <div className="p-5">
            <div className="text-sm text-slate-700 whitespace-pre-line">{message}</div>
            <div className="mt-5 flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={onCancel}
                disabled={loading}
              >
                {cancelText}
              </Button>
              <Button className="flex-1" onClick={onConfirm} disabled={loading}>
                {loading ? "Please wait..." : confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}