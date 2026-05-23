import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CenteredCard from "../components/CenteredCard";
import Button from "../components/Button";
import { apiFetch, type ApiError } from "../api/http";

type LoginResponse = {
  message: string;
  email: string;
};

function isEmpIdMailbox(email: string) {
  const v = (email || "").trim();
  const at = v.indexOf("@");
  if (at <= 0) return false; // not enough to decide
  const local = v.slice(0, at);
  return /^[0-9]+$/.test(local); // ✅ only digits before @
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [needName, setNeedName] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const empIdBlocked = useMemo(() => isEmpIdMailbox(email), [email]);

  async function onSendOtp() {
    setErr(null);
    setInfo(null);

    if (empIdBlocked) {
      setErr("Please use your name-based mailbox . Employee-ID mailboxes are not allowed.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = { email: email.trim() };
      if (needName) {
        payload.first_name = firstName.trim();
        payload.last_name = lastName.trim();
      }

      const res = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setNeedName(false);
      setInfo(res.message || "OTP sent.");

      navigate("/verify?email=" + encodeURIComponent(res.email), {
        state: { email: res.email },
      });
    } catch (e) {
      const apiErr = e as ApiError;
      const detail = apiErr.detail || "Failed to send OTP.";

      if (
        apiErr.status === 400 &&
        typeof detail === "string" &&
        detail.toLowerCase().includes("first and last name")
      ) {
        setNeedName(true);
        setErr("Looks like you are a new user. Please enter First name and Last name to continue.");
      } else {
        setErr(detail);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <CenteredCard subtitle="">
      {err ? <div className="banner-error">{err}</div> : null}
      {info ? <div className="banner-info">{info}</div> : null}

      <label className="block mt-4 text-left">
        <span className="label">Email</span>
        <input
          className="input"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErr(null);
            setInfo(null);
          }}
          placeholder=""
          inputMode="email"
          autoComplete="email"
        />
        {empIdBlocked ? (
          <div className="mt-2 text-xs font-semibold text-rose-700">
            Please use your name-based mailbox.
          </div>
        ) : null}
      </label>

      {needName ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-left">
            <span className="label">First name</span>
            <input
              className="input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
            />
          </label>

          <label className="block text-left">
            <span className="label">Last name</span>
            <input
              className="input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
            />
          </label>
        </div>
      ) : null}

      <div className="mt-6">
        <Button
          onClick={onSendOtp}
          disabled={
            loading ||
            !email.trim() ||
            empIdBlocked ||
            (needName && (!firstName.trim() || !lastName.trim()))
          }
          className="w-full"
        >
          {loading ? "Sending..." : "Send OTP"}
        </Button>
      </div>
    </CenteredCard>
  );
}