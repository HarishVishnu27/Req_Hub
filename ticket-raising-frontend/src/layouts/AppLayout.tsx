import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearAuth, getAuth } from "../auth/authStore";
import fastestLogo from "../assets/Fastest.png";

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "inline-flex items-center justify-center", // ✅ makes whole area clickable
          "cursor-pointer select-none",
          "px-4 py-2 rounded-xl",
          "text-lg font-semibold transition whitespace-nowrap",
          isActive ? "text-white" : "text-slate-700 hover:bg-slate-100",
        ].join(" ")
      }
      style={({ isActive }) => (isActive ? { background: "var(--brand)" } : undefined)}
    >
      {label}
    </NavLink>
  );
}

export default function AppLayout() {
  const navigate = useNavigate();
  const auth = getAuth();
  const isAdmin = !!auth?.user?.is_admin;

  function logout() {
    clearAuth();
    navigate("/login");
  }

  return (
    <div className="min-h-full w-full">
      <header className="sticky top-0 z-40 border-b border-slate-300/70 bg-slate-50/90 backdrop-blur">
        <div className="w-full px-3 sm:px-6 py-3">
          {/* ✅ Flex layout prevents overlap */}
          <div className="relative flex items-center justify-between gap-4">
            {/* Left */}
            <div className="flex items-center gap-3 pl-2 shrink-0">
              <img
                src={fastestLogo}
                alt="Fastest"
                className="h-14 w-auto select-none"
                draggable={false}
              />
            </div>

            {/* Center (absolute centered on large screens) */}
            <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center justify-center gap-2">
              <NavItem to="/app/home" label="Home" />
              <NavItem to="/app/mobile" label="Mobile Devices" />
              <NavItem to="/app/vm" label="Virtual Machines" />
              <NavItem to="/app/environment" label="Environment" />
              {isAdmin ? <NavItem to="/app/admin/tickets" label="Admin" /> : null}
            </nav>

            {/* Right */}
            <div className="flex items-center justify-end gap-3 pr-2 shrink-0">
              <div className="hidden md:block text-sm text-slate-600 truncate max-w-[420px]">
                {auth?.user?.email || ""}
              </div>
              <button className="btn-secondary px-5 py-2 text-base" onClick={logout}>
                Logout
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          <div className="lg:hidden mt-3 flex flex-wrap items-center justify-center gap-2">
            <NavItem to="/app/home" label="Home" />
            <NavItem to="/app/mobile" label="Mobile" />
            <NavItem to="/app/vm" label="VM" />
            <NavItem to="/app/environment" label="Env" />
            {isAdmin ? <NavItem to="/app/admin/tickets" label="Admin" /> : null}
          </div>
        </div>
      </header>

      <main className="w-full px-3 sm:px-6 py-8">
        <div className="mx-auto w-full max-w-[1600px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}