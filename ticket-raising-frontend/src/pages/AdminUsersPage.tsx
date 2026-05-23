import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import Button from "../components/Button";
import ConfirmDialog from "../components/ConfirmDialog";
import { apiFetch, type ApiError } from "../api/http";
import { getAuth } from "../auth/authStore";

type UserRow = {
  email_hash: string;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  created_at?: string;
  updated_at?: string;
};

type ListUsersResponse = { users: UserRow[] };

function AdminTabs() {
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    [
      "cursor-pointer select-none",
      "px-3 py-2 rounded-xl text-sm font-semibold transition",
      isActive ? "text-white" : "text-slate-700 hover:bg-slate-100",
    ].join(" ");

  return (
    <div className="flex gap-2">
      <NavLink
        to="/app/admin/tickets"
        className={tabClass as any}
        style={({ isActive }) => (isActive ? { background: "var(--brand)" } : undefined)}
      >
        Tickets
      </NavLink>
      <NavLink
        to="/app/admin/users"
        className={tabClass as any}
        style={({ isActive }) => (isActive ? { background: "var(--brand)" } : undefined)}
      >
        Users
      </NavLink>
    </div>
  );
}

export default function AdminUsersPage() {
  const auth = getAuth();
  const isAdmin = !!auth?.user?.is_admin;

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // create/edit modal
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingHash, setEditingHash] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // role confirm modal
  const [roleConfirmOpen, setRoleConfirmOpen] = useState(false);
  const [roleConfirmLoading, setRoleConfirmLoading] = useState(false);
  const [rolePending, setRolePending] = useState<{ user: UserRow; next: boolean } | null>(null);

  // delete confirm modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const res = await apiFetch<ListUsersResponse>("/admin/users");
      setUsers(res.users);
    } catch (e) {
      const apiErr = e as ApiError;
      setErr(apiErr.detail || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const sorted = useMemo(() => {
    return [...users].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  }, [users]);

  function openCreate() {
    setMode("create");
    setEditingHash(null);
    setEmail("");
    setFirstName("");
    setLastName("");
    setOpen(true);
    setMsg(null);
    setErr(null);
  }

  function openEdit(u: UserRow) {
    setMode("edit");
    setEditingHash(u.email_hash);
    setEmail(u.email);
    setFirstName(u.first_name);
    setLastName(u.last_name);
    setOpen(true);
    setMsg(null);
    setErr(null);
  }

  async function save() {
    setMsg(null);
    setErr(null);

    try {
      if (mode === "create") {
        await apiFetch("/admin/users", {
          method: "POST",
          body: JSON.stringify({
            email,
            first_name: firstName,
            last_name: lastName,
            is_admin: false,
          }),
        });
        setMsg("User created.");
      } else {
        await apiFetch(`/admin/users/${editingHash}`, {
          method: "PATCH",
          body: JSON.stringify({
            email,
            first_name: firstName,
            last_name: lastName,
          }),
        });
        setMsg("User updated.");
      }

      setOpen(false);
      await load();
    } catch (e) {
      const apiErr = e as ApiError;
      setErr(apiErr.detail || "Save failed.");
    }
  }

  function askToggleAdmin(u: UserRow) {
    const next = !u.is_admin;
    setRolePending({ user: u, next });
    setRoleConfirmOpen(true);
  }

  async function confirmToggleAdmin() {
    if (!rolePending) return;
    setRoleConfirmLoading(true);
    setMsg(null);
    setErr(null);

    try {
      await apiFetch(`/admin/users/${rolePending.user.email_hash}/role`, {
        method: "PATCH",
        body: JSON.stringify({ is_admin: rolePending.next }),
      });
      setRoleConfirmOpen(false);
      setRolePending(null);
      await load();
    } catch (e) {
      const apiErr = e as ApiError;
      setErr(apiErr.detail || "Failed to update role.");
    } finally {
      setRoleConfirmLoading(false);
    }
  }

  function cancelToggleAdmin() {
    setRoleConfirmOpen(false);
    setRolePending(null);
  }

  function askDelete(u: UserRow) {
    setDeleteUser(u);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteUser) return;
    setDeleteLoading(true);
    setMsg(null);
    setErr(null);

    try {
      await apiFetch(`/admin/users/${deleteUser.email_hash}`, { method: "DELETE" });
      setDeleteOpen(false);
      setDeleteUser(null);
      setMsg("User deleted.");
      await load();
    } catch (e) {
      const apiErr = e as ApiError;
      setErr(apiErr.detail || "Failed to delete user.");
    } finally {
      setDeleteLoading(false);
    }
  }

  function cancelDelete() {
    setDeleteOpen(false);
    setDeleteUser(null);
  }

  if (!isAdmin) {
    return (
      <div className="card p-6">
        <div className="text-lg font-semibold text-slate-900">Admin</div>
        <div className="mt-2 text-sm text-slate-600">Admin access required.</div>
      </div>
    );
  }

  const roleMsg =
    rolePending
      ? `Change role for:\n${rolePending.user.email}\n\nAdmin → ${rolePending.next ? "YES" : "NO"}`
      : "";

  const deleteMsg = deleteUser
    ? `Delete user?\n\n${deleteUser.first_name} ${deleteUser.last_name}\n${deleteUser.email}\n\nThis cannot be undone.`
    : "";

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={roleConfirmOpen}
        title="Confirm Role Change"
        message={roleMsg}
        confirmText="Yes, Change"
        cancelText="Cancel"
        onConfirm={confirmToggleAdmin}
        onCancel={cancelToggleAdmin}
        loading={roleConfirmLoading}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Confirm Delete User"
        message={deleteMsg}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={deleteLoading}
      />

      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin</h1>
            <p className="mt-1 text-sm text-slate-600">Manage users.</p>
          </div>

          <div className="flex items-center gap-3">
            <AdminTabs />
            <Button variant="secondary" onClick={load} disabled={loading}>
              Refresh
            </Button>
            <Button onClick={openCreate}>Add User</Button>
          </div>
        </div>

        {msg ? <div className="mt-4 banner-success">{msg}</div> : null}
        {err ? <div className="mt-4 banner-error">{err}</div> : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="card w-full max-w-xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50">
                <div className="text-sm font-semibold text-slate-900">
                  {mode === "create" ? "Add User" : "Edit User"}
                </div>
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>

              <div className="p-5 space-y-4">
                <label className="block">
                  <span className="label">Email</span>
                  <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="label">First name</span>
                    <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </label>
                  <label className="block">
                    <span className="label">Last name</span>
                    <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={save} disabled={!email.trim() || !firstName.trim() || !lastName.trim()}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Admin</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((u) => {
                const deleteDisabled = u.is_admin; // ✅ must remove admin first
                return (
                  <tr key={u.email_hash} className="border-t border-slate-200">
                    <td className="px-4 py-3 text-slate-900 font-semibold">
                      {u.first_name} {u.last_name}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={u.is_admin ? "banner-success" : "banner-info"}>
                        {u.is_admin ? "YES" : "NO"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => openEdit(u)}>
                          Edit
                        </Button>
                        <Button onClick={() => askToggleAdmin(u)}>
                          {u.is_admin ? "Remove Admin" : "Make Admin"}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => askDelete(u)}
                          disabled={deleteDisabled}
                          title={deleteDisabled ? "Remove admin access first to delete." : "Delete user"}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!sorted.length ? (
                <tr>
                  <td className="px-4 py-6 text-slate-600" colSpan={4}>
                    {loading ? "Loading..." : "No users found."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}