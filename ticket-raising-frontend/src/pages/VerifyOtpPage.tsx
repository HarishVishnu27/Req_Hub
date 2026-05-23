import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import CenteredCard from "../components/CenteredCard";
import Button from "../components/Button";
import { apiFetch, type ApiError } from "../api/http";
import { setAuth, setUserProfile } from "../auth/authStore";

type VerifyResponse = {
  message: string;
  token: string;
};

type MeResponse = {
  user: {
    email: string;
    first_name: string;
    last_name: string;
    email_hash: string;
    is_admin: boolean;
  };
};

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const [searchParams] = useSearchParams();

  const email = useMemo(() => {
    const fromState = location?.state?.email;
    const fromQuery = searchParams.get("email");
    return (fromState || fromQuery || "").toString();
  }, [location?.state?.email, searchParams]);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onVerify() {
    setErr(null);
    if (!email) return setErr("Email is missing. Please go back and login again.");

    setLoading(true);
    try {
      const res = await apiFetch<VerifyResponse>("/auth/verify", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });

      // store token only first
      setAuth({ token: res.token });

      // fetch decrypted profile
      const me = await apiFetch<MeResponse>("/auth/me");
      setUserProfile(me.user);

      navigate("/app/home");
    } catch (e) {
      const apiErr = e as ApiError;
      setErr(apiErr.detail || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CenteredCard>
      {err ? <div className="banner-error">{err}</div> : null}

      <div className="mt-4 text-left">
        <div className="label">Email</div>
        <div className="mt-1 text-sm text-slate-700">{email || "-"}</div>
      </div>

      <label className="block mt-4 text-left">
        <span className="label">OTP</span>
        <input
          className="input"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter 6-digit OTP"
        />
      </label>

      <div className="mt-6 flex gap-3">
        <Button variant="secondary" onClick={() => navigate("/login")} className="flex-1" disabled={loading}>
          Back
        </Button>
        <Button onClick={onVerify} disabled={loading || !email || otp.trim().length < 6} className="flex-1">
          {loading ? "Verifying..." : "Verify"}
        </Button>
      </div>
    </CenteredCard>
  );
}