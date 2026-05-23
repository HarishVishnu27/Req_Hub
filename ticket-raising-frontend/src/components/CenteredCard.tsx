import {type ReactNode } from "react";
import fastestLogo from "../assets/Fastest.png";

export default function CenteredCard({
  children,
  subtitle,
}: {
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card p-8 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-indigo-500/10 blur-2xl" />

          <div className="relative">
            <div className="flex justify-center">
              <img
                src={fastestLogo}
                alt="Fastest"
                className="h-36 w-auto select-none"
                draggable={false}
              />
            </div>

            {subtitle ? (
              <p className="mt-3 text-center text-sm text-slate-600">{subtitle}</p>
            ) : null}

            <div className="mt-8">{children}</div>
          </div>
        </div>

      </div>
    </div>
  );
}