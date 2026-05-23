import {type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getAuth } from "./authStore";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const auth = getAuth();
  if (!auth?.token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}