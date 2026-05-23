import clsx from "clsx";

export default function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input {...props} className={clsx("input", props.className)} />
    </label>
  );
}