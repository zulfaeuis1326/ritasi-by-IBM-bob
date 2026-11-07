"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Check, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Pit {
  id: string; name: string; code: string; description: string | null; isActive: boolean;
}
interface Fleet {
  id: string; name: string; code: string; pitId: string; isActive: boolean;
  pit: { name: string; code: string };
}
interface Hauler {
  id: string; unitNumber: string; type: string; capacity: number | null; fleetId: string; isActive: boolean;
  fleet: { name: string; code: string; pit: { name: string } };
}
interface PengawasUser {
  id: string; name: string; username: string; isActive: boolean;
  pit: { name: string } | null;
}

interface Props {
  pits: Pit[];
  fleets: Fleet[];
  haulers: Hauler[];
  users: PengawasUser[];
}

type TabKey = "pit" | "fleet" | "hauler" | "user";

// ─── Generic CRUD helpers ─────────────────────────────────────────────────────

async function apiCall(url: string, method: string, body?: object) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Gagal");
  return data;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TableHeader({ cols }: { cols: string[] }) {
  return (
    <tr className="border-b border-border">
      {cols.map((c) => (
        <th key={c} className="py-2 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {c}
        </th>
      ))}
      <th className="py-2 text-right text-xs font-semibold text-gray-500">Aksi</th>
    </tr>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border",
      active ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"
    )}>
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}

// ─── PIT Tab ─────────────────────────────────────────────────────────────────

function PitTab({ initialPits }: { initialPits: Pit[] }) {
  const [pits, setPits] = useState(initialPits);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const showMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const startEdit = (p: Pit) => {
    setEditId(p.id); setShowForm(true);
    setForm({ name: p.name, code: p.code, description: p.description ?? "" });
  };
  const cancelForm = () => { setShowForm(false); setEditId(null); setForm({ name: "", code: "", description: "" }); };

  const save = async () => {
    setLoading(true);
    try {
      if (editId) {
        const data = await apiCall(`/api/admin/pits/${editId}`, "PATCH", form);
        setPits((p) => p.map((x) => x.id === editId ? data.pit : x));
        showMsg("PIT diupdate");
      } else {
        const data = await apiCall("/api/admin/pits", "POST", form);
        setPits((p) => [...p, data.pit]);
        showMsg("PIT ditambahkan");
      }
      cancelForm();
    } catch (e: unknown) { showMsg(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus PIT ini? Semua fleet dan hauler di dalamnya akan terhapus.")) return;
    setLoading(true);
    try {
      await apiCall(`/api/admin/pits/${id}`, "DELETE");
      setPits((p) => p.filter((x) => x.id !== id));
      showMsg("PIT dihapus");
    } catch (e: unknown) { showMsg(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  };

  return (
    <div>
      {toast && <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{toast}</div>}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{pits.length} PIT terdaftar</p>
        <button onClick={() => { setShowForm(true); setEditId(null); }} className="btn-primary py-2 text-sm">
          <Plus className="h-4 w-4" /> Tambah PIT
        </button>
      </div>

      {showForm && (
        <div className="card p-4 mb-4 space-y-3">
          <h4 className="font-semibold text-gray-900">{editId ? "Edit PIT" : "Tambah PIT Baru"}</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nama PIT</label><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="PIT Alpha" /></div>
            <div><label className="label">Kode</label><input className="input" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="PA" maxLength={10} /></div>
          </div>
          <div><label className="label">Deskripsi (opsional)</label><input className="input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Keterangan area..." /></div>
          <div className="flex gap-2">
            <button onClick={save} disabled={loading} className="btn-primary py-2 text-sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Simpan
            </button>
            <button onClick={cancelForm} className="btn-secondary py-2 text-sm"><X className="h-4 w-4" /> Batal</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 px-4"><tr className="px-4"><TableHeader cols={["Nama", "Kode", "Deskripsi", "Status"]} /></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {pits.map((p) => (
              <tr key={p.id} className="px-4 hover:bg-gray-50">
                <td className="py-3 pr-4 font-medium">{p.name}</td>
                <td className="py-3 pr-4 font-mono text-xs">{p.code}</td>
                <td className="py-3 pr-4 text-gray-500">{p.description ?? "–"}</td>
                <td className="py-3 pr-4"><StatusBadge active={p.isActive} /></td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => startEdit(p)} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-gray-400 hover:text-primary-700"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(p.id)} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-gray-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Fleet Tab ────────────────────────────────────────────────────────────────

function FleetTab({ initialFleets, pits }: { initialFleets: Fleet[]; pits: Pit[] }) {
  const [fleets, setFleets] = useState(initialFleets);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "", pitId: pits[0]?.id ?? "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const showMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };
  const cancelForm = () => { setShowForm(false); setEditId(null); };

  const startEdit = (f: Fleet) => {
    setEditId(f.id); setShowForm(true);
    setForm({ name: f.name, code: f.code, pitId: f.pitId });
  };

  const save = async () => {
    setLoading(true);
    try {
      if (editId) {
        const data = await apiCall(`/api/admin/fleets/${editId}`, "PATCH", form);
        setFleets((prev) => prev.map((x) => x.id === editId ? { ...data.fleet, pit: pits.find((p) => p.id === data.fleet.pitId) ?? x.pit } : x));
        showMsg("Fleet diupdate");
      } else {
        const data = await apiCall("/api/admin/fleets", "POST", form);
        const pit = pits.find((p) => p.id === form.pitId);
        setFleets((prev) => [...prev, { ...data.fleet, pit: { name: pit?.name ?? "", code: pit?.code ?? "" } }]);
        showMsg("Fleet ditambahkan");
      }
      cancelForm();
    } catch (e: unknown) { showMsg(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus fleet ini?")) return;
    setLoading(true);
    try {
      await apiCall(`/api/admin/fleets/${id}`, "DELETE");
      setFleets((prev) => prev.filter((x) => x.id !== id));
      showMsg("Fleet dihapus");
    } catch (e: unknown) { showMsg(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  };

  return (
    <div>
      {toast && <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{toast}</div>}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{fleets.length} fleet terdaftar</p>
        <button onClick={() => { setShowForm(true); setEditId(null); }} className="btn-primary py-2 text-sm"><Plus className="h-4 w-4" /> Tambah Fleet</button>
      </div>

      {showForm && (
        <div className="card p-4 mb-4 space-y-3">
          <h4 className="font-semibold">{editId ? "Edit Fleet" : "Tambah Fleet"}</h4>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Nama</label><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><label className="label">Kode</label><input className="input" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} /></div>
            <div>
              <label className="label">PIT</label>
              <select className="input" value={form.pitId} onChange={(e) => setForm((f) => ({ ...f, pitId: e.target.value }))}>
                {pits.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={loading} className="btn-primary py-2 text-sm">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Simpan</button>
            <button onClick={cancelForm} className="btn-secondary py-2 text-sm"><X className="h-4 w-4" /> Batal</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><TableHeader cols={["Nama", "Kode", "PIT", "Status"]} /></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {fleets.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="py-3 pr-4 font-medium">{f.name}</td>
                <td className="py-3 pr-4 font-mono text-xs">{f.code}</td>
                <td className="py-3 pr-4 text-gray-600">{f.pit.name}</td>
                <td className="py-3 pr-4"><StatusBadge active={f.isActive} /></td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => startEdit(f)} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-gray-400 hover:text-primary-700"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(f.id)} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-gray-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Hauler Tab ───────────────────────────────────────────────────────────────

function HaulerTab({ initialHaulers, fleets }: { initialHaulers: Hauler[]; fleets: Fleet[] }) {
  const [haulers, setHaulers] = useState(initialHaulers);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ unitNumber: "", type: "", capacity: "", fleetId: fleets[0]?.id ?? "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const showMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };
  const cancelForm = () => { setShowForm(false); setEditId(null); };

  const startEdit = (h: Hauler) => {
    setEditId(h.id); setShowForm(true);
    setForm({ unitNumber: h.unitNumber, type: h.type, capacity: h.capacity?.toString() ?? "", fleetId: h.fleetId });
  };

  const save = async () => {
    setLoading(true);
    try {
      const payload = { ...form, capacity: form.capacity ? parseFloat(form.capacity) : null };
      if (editId) {
        const data = await apiCall(`/api/admin/haulers/${editId}`, "PATCH", payload);
        const fleet = fleets.find((f) => f.id === data.hauler.fleetId);
        setHaulers((prev) => prev.map((x) => x.id === editId ? { ...data.hauler, fleet: { name: fleet?.name ?? "", code: fleet?.code ?? "", pit: { name: fleet?.pit.name ?? "" } } } : x));
        showMsg("Unit diupdate");
      } else {
        const data = await apiCall("/api/admin/haulers", "POST", payload);
        const fleet = fleets.find((f) => f.id === form.fleetId);
        setHaulers((prev) => [...prev, { ...data.hauler, fleet: { name: fleet?.name ?? "", code: fleet?.code ?? "", pit: { name: fleet?.pit.name ?? "" } } }]);
        showMsg("Unit ditambahkan");
      }
      cancelForm();
    } catch (e: unknown) { showMsg(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus unit ini?")) return;
    setLoading(true);
    try {
      await apiCall(`/api/admin/haulers/${id}`, "DELETE");
      setHaulers((prev) => prev.filter((x) => x.id !== id));
      showMsg("Unit dihapus");
    } catch (e: unknown) { showMsg(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  };

  return (
    <div>
      {toast && <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{toast}</div>}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{haulers.length} unit terdaftar</p>
        <button onClick={() => { setShowForm(true); setEditId(null); }} className="btn-primary py-2 text-sm"><Plus className="h-4 w-4" /> Tambah Unit</button>
      </div>

      {showForm && (
        <div className="card p-4 mb-4 space-y-3">
          <h4 className="font-semibold">{editId ? "Edit Unit" : "Tambah Unit"}</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nomor Unit</label><input className="input" value={form.unitNumber} onChange={(e) => setForm((f) => ({ ...f, unitNumber: e.target.value }))} placeholder="DT-013" /></div>
            <div><label className="label">Tipe</label><input className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} placeholder="CAT 777G" /></div>
            <div><label className="label">Kapasitas (ton)</label><input type="number" className="input" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} placeholder="90" /></div>
            <div>
              <label className="label">Fleet</label>
              <select className="input" value={form.fleetId} onChange={(e) => setForm((f) => ({ ...f, fleetId: e.target.value }))}>
                {fleets.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.pit.name})</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={loading} className="btn-primary py-2 text-sm">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Simpan</button>
            <button onClick={cancelForm} className="btn-secondary py-2 text-sm"><X className="h-4 w-4" /> Batal</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><TableHeader cols={["Unit", "Tipe", "Kapasitas", "Fleet", "PIT", "Status"]} /></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {haulers.map((h) => (
              <tr key={h.id} className="hover:bg-gray-50">
                <td className="py-3 pr-4 font-mono font-semibold">{h.unitNumber}</td>
                <td className="py-3 pr-4 text-gray-600">{h.type}</td>
                <td className="py-3 pr-4 text-gray-600">{h.capacity ? `${h.capacity} t` : "–"}</td>
                <td className="py-3 pr-4 text-gray-600">{h.fleet.name}</td>
                <td className="py-3 pr-4 text-gray-600">{h.fleet.pit.name}</td>
                <td className="py-3 pr-4"><StatusBadge active={h.isActive} /></td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => startEdit(h)} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-gray-400 hover:text-primary-700"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(h.id)} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-gray-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── User Tab ─────────────────────────────────────────────────────────────────

function UserTab({ initialUsers, pits }: { initialUsers: PengawasUser[]; pits: Pit[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", username: "", password: "", pitId: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const showMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };
  const cancelForm = () => { setShowForm(false); setEditId(null); setForm({ name: "", username: "", password: "", pitId: "" }); };

  const startEdit = (u: PengawasUser) => {
    setEditId(u.id); setShowForm(true);
    setForm({ name: u.name, username: u.username, password: "", pitId: (u as any).pitId ?? "" });
  };

  const save = async () => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { name: form.name, username: form.username, role: "PENGAWAS", pitId: form.pitId || null };
      if (form.password) payload.password = form.password;
      if (editId) {
        const data = await apiCall(`/api/admin/users/${editId}`, "PATCH", payload);
        const pit = pits.find((p) => p.id === form.pitId);
        setUsers((prev) => prev.map((x) => x.id === editId ? { ...data.user, pit: pit ? { name: pit.name } : null } : x));
        showMsg("Pengawas diupdate");
      } else {
        if (!form.password) { showMsg("Password wajib diisi"); setLoading(false); return; }
        const data = await apiCall("/api/admin/users", "POST", { ...payload, password: form.password });
        const pit = pits.find((p) => p.id === form.pitId);
        setUsers((prev) => [...prev, { ...data.user, pit: pit ? { name: pit.name } : null }]);
        showMsg("Pengawas ditambahkan");
      }
      cancelForm();
    } catch (e: unknown) { showMsg(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  };

  const toggleActive = async (u: PengawasUser) => {
    try {
      const data = await apiCall(`/api/admin/users/${u.id}`, "PATCH", { isActive: !u.isActive });
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, isActive: data.user.isActive } : x));
      showMsg(data.user.isActive ? "Akun diaktifkan" : "Akun dinonaktifkan");
    } catch (e: unknown) { showMsg(e instanceof Error ? e.message : "Error"); }
  };

  return (
    <div>
      {toast && <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{toast}</div>}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{users.length} pengawas terdaftar</p>
        <button onClick={() => { setShowForm(true); setEditId(null); }} className="btn-primary py-2 text-sm"><Plus className="h-4 w-4" /> Tambah Pengawas</button>
      </div>

      {showForm && (
        <div className="card p-4 mb-4 space-y-3">
          <h4 className="font-semibold">{editId ? "Edit Pengawas" : "Tambah Pengawas"}</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nama Lengkap</label><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><label className="label">Username</label><input className="input" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} /></div>
            <div><label className="label">{editId ? "PIN Baru (kosongkan jika tidak ganti)" : "PIN / Password"}</label><input type="password" className="input" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></div>
            <div>
              <label className="label">PIT (opsional)</label>
              <select className="input" value={form.pitId} onChange={(e) => setForm((f) => ({ ...f, pitId: e.target.value }))}>
                <option value="">Semua PIT</option>
                {pits.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={loading} className="btn-primary py-2 text-sm">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Simpan</button>
            <button onClick={cancelForm} className="btn-secondary py-2 text-sm"><X className="h-4 w-4" /> Batal</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><TableHeader cols={["Nama", "Username", "PIT", "Status"]} /></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="py-3 pr-4 font-medium">{u.name}</td>
                <td className="py-3 pr-4 font-mono text-xs">{u.username}</td>
                <td className="py-3 pr-4 text-gray-600">{u.pit?.name ?? "Semua PIT"}</td>
                <td className="py-3 pr-4"><StatusBadge active={u.isActive} /></td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => startEdit(u)} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-gray-400 hover:text-primary-700"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => toggleActive(u)} className={cn("h-7 w-7 rounded-lg border flex items-center justify-center text-xs font-bold", u.isActive ? "border-red-200 text-red-500 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50")}>{u.isActive ? "✕" : "✓"}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string }[] = [
  { key: "pit", label: "PIT" },
  { key: "fleet", label: "Fleet" },
  { key: "hauler", label: "Unit / Hauler" },
  { key: "user", label: "Pengawas" },
];

export default function MasterDataView({ pits, fleets, haulers, users }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("pit");

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-5 max-w-7xl mx-auto">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Master Data</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola PIT, fleet, unit, dan akun pengawas</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === t.key
                  ? "bg-white text-gray-900 shadow-card"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "pit" && <PitTab initialPits={pits} />}
        {activeTab === "fleet" && <FleetTab initialFleets={fleets} pits={pits} />}
        {activeTab === "hauler" && <HaulerTab initialHaulers={haulers} fleets={fleets} />}
        {activeTab === "user" && <UserTab initialUsers={users} pits={pits} />}
      </div>
    </div>
  );
}
