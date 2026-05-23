import clsx from "clsx";

export default function Button({
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      {...props}
      className={clsx(
        variant === "primary" ? "btn-primary" : "btn-secondary",
        props.className
      )}
    />
  );
}