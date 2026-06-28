"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { CallTodo } from "@/types";
import {
  Phone,
  CheckCircle2,
  Circle,
  Trash2,
  Building2,
  StickyNote,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

type Filter = "all" | "pending" | "done";

function AddTodoModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const supabase = createClient();
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [recruiter, setRecruiter] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase.from("call_todos").insert({
      user_id: user.id,
      phone: phone.trim(),
      company_name: company.trim() || null,
      recruiter_name: recruiter.trim() || null,
      notes: notes.trim() || null,
    });

    setSaving(false);
    if (error) {
      toast.error("Failed to add todo");
    } else {
      toast.success("Added to call list!");
      onAdded();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-900">Add to Call List</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone number *</label>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Google, Amazon…"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Recruiter name</label>
            <input
              type="text"
              value={recruiter}
              onChange={(e) => setRecruiter(e.target.value)}
              placeholder="Jane Smith"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Best time to call: morning…"
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-700 text-sm py-2.5 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white text-sm py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TodosPage() {
  const supabase = createClient();
  const [todos, setTodos] = useState<CallTodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [showAdd, setShowAdd] = useState(false);

  async function loadTodos() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("call_todos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setTodos(data || []);
    setLoading(false);
  }

  useEffect(() => { loadTodos(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleDone(todo: CallTodo) {
    const newDone = !todo.is_done;
    const { error } = await supabase
      .from("call_todos")
      .update({ is_done: newDone, called_at: newDone ? new Date().toISOString() : null })
      .eq("id", todo.id);

    if (error) {
      toast.error("Failed to update");
    } else {
      toast.success(newDone ? "Marked as called!" : "Marked as pending");
      loadTodos();
    }
  }

  async function deleteTodo(id: string) {
    const { error } = await supabase.from("call_todos").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Removed");
      setTodos((prev) => prev.filter((t) => t.id !== id));
    }
  }

  const filtered = todos.filter((t) => {
    if (filter === "pending") return !t.is_done;
    if (filter === "done") return t.is_done;
    return true;
  });

  const pendingCount = todos.filter((t) => !t.is_done).length;
  const doneCount = todos.filter((t) => t.is_done).length;

  return (
    <div className="p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Call List</h1>
          <p className="text-slate-500 text-sm mt-1">
            Track recruiters you need to call.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add manually
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 w-fit">
        {(["all", "pending", "done"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {f}
            {f === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
            {f === "done" && doneCount > 0 && (
              <span className="ml-1.5 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">
                {doneCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Phone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            {filter === "all"
              ? "No calls in your list. Upload a screenshot or add one manually."
              : `No ${filter} calls.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((todo) => (
            <div
              key={todo.id}
              className={`bg-white rounded-xl border p-4 flex items-start gap-3 transition-all ${
                todo.is_done ? "border-slate-100 opacity-60" : "border-slate-200"
              }`}
            >
              <button
                onClick={() => toggleDone(todo)}
                className={`mt-0.5 shrink-0 ${
                  todo.is_done ? "text-green-500" : "text-slate-300 hover:text-blue-500"
                } transition-colors`}
              >
                {todo.is_done ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`font-semibold text-slate-900 ${
                      todo.is_done ? "line-through" : ""
                    }`}
                  >
                    {todo.phone}
                  </span>
                  {todo.recruiter_name && (
                    <span className="text-sm text-slate-500">· {todo.recruiter_name}</span>
                  )}
                </div>

                {todo.company_name && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <Building2 className="w-3 h-3" />
                    {todo.company_name}
                  </div>
                )}

                {todo.notes && (
                  <div className="flex items-start gap-1 text-xs text-slate-500 mt-1">
                    <StickyNote className="w-3 h-3 mt-0.5" />
                    <span>{todo.notes}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-slate-400">
                    Added {formatDateTime(todo.created_at)}
                  </span>
                  {todo.is_done && todo.called_at && (
                    <span className="text-xs text-green-600">
                      Called {formatDateTime(todo.called_at)}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddTodoModal onClose={() => setShowAdd(false)} onAdded={loadTodos} />
      )}
    </div>
  );
}
