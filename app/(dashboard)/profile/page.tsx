"use client";

import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Profile, Resume, Experience, Education } from "@/types";
import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Save,
  Upload,
  Trash2,
  Plus,
  Star,
  Loader2,
  Check,
  Mail,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";

type Tab = "personal" | "resume" | "experience" | "education" | "email";

// ── Personal Info ──────────────────────────────────────────
function PersonalTab({ userId }: { userId: string }) {
  const supabase = createClient();
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", userId).single().then(({ data }) => {
      if (data) setProfile(data);
      setLoading(false);
    });
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      ...profile,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) toast.error("Failed to save");
    else toast.success("Profile updated!");
  }

  if (loading) return <div className="py-12 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin inline" /></div>;

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-lg">
      {[
        { label: "Full name", key: "full_name", type: "text", placeholder: "Adesh Dhage" },
        { label: "Phone number", key: "phone", type: "tel", placeholder: "+91 98765 43210" },
        { label: "LinkedIn URL", key: "linkedin_url", type: "url", placeholder: "https://linkedin.com/in/yourprofile" },
      ].map(({ label, key, type, placeholder }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
          <input
            type={type}
            value={(profile as Record<string, string>)[key] || ""}
            onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
            placeholder={placeholder}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Professional summary</label>
        <textarea
          value={profile.summary || ""}
          onChange={(e) => setProfile((p) => ({ ...p, summary: e.target.value }))}
          placeholder="Experienced software engineer with 5+ years in…"
          rows={3}
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* ── Application Email Pitch ── */}
      <div className="pt-5 border-t border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">Application Email Pitch</h3>
        <p className="text-xs text-slate-400 mt-0.5 mb-4">
          These auto-fill every application email you send. Keep them short and specific.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Headline</label>
            <input
              type="text"
              value={profile.headline || ""}
              onChange={(e) => setProfile((p) => ({ ...p, headline: e.target.value }))}
              placeholder="Software Developer"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Years of exp.</label>
            <input
              type="text"
              value={profile.years_experience || ""}
              onChange={(e) => setProfile((p) => ({ ...p, years_experience: e.target.value }))}
              placeholder="3"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Key skills</label>
            <input
              type="text"
              value={profile.key_skills || ""}
              onChange={(e) => setProfile((p) => ({ ...p, key_skills: e.target.value }))}
              placeholder="React, Node.js, AWS"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Standout achievement <span className="text-slate-400 font-normal">— measurable & stack-relevant</span>
          </label>
          <textarea
            value={profile.key_achievement || ""}
            onChange={(e) => setProfile((p) => ({ ...p, key_achievement: e.target.value }))}
            placeholder={`At Acme, I built a React dashboard used by 10,000+ users that cut report-generation time by 60%.`}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Portfolio / GitHub URL</label>
          <input
            type="url"
            value={profile.portfolio_url || ""}
            onChange={(e) => setProfile((p) => ({ ...p, portfolio_url: e.target.value }))}
            placeholder="https://github.com/yourusername"
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save changes
      </button>
    </form>
  );
}

// ── Resume Tab ─────────────────────────────────────────────
function ResumeTab({ userId }: { userId: string }) {
  const supabase = createClient();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadResumes() {
    const { data } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setResumes(data || []);
    setLoading(false);
  }

  useEffect(() => { loadResumes(); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file || file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    setUploading(true);

    const fileName = `${userId}/${Date.now()}_${file.name}`;
    const { data: upload, error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(upload.path);
    const isFirst = resumes.length === 0;

    await supabase.from("resumes").insert({
      user_id: userId,
      file_name: file.name,
      file_url: urlData.publicUrl,
      is_default: isFirst,
    });

    toast.success("Resume uploaded!");
    setUploading(false);
    loadResumes();
  }, [userId, resumes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [] },
    maxFiles: 1,
  });

  async function setDefault(id: string) {
    await supabase.from("resumes").update({ is_default: false }).eq("user_id", userId);
    await supabase.from("resumes").update({ is_default: true }).eq("id", id);
    toast.success("Default resume updated");
    loadResumes();
  }

  async function deleteResume(resume: Resume) {
    const path = resume.file_url.split("/resumes/")[1];
    if (path) await supabase.storage.from("resumes").remove([path]);
    await supabase.from("resumes").delete().eq("id", resume.id);
    toast.success("Resume deleted");
    loadResumes();
  }

  return (
    <div className="space-y-5 max-w-lg">
      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-blue-600 py-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Uploading…</span>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">
              {isDragActive ? "Drop PDF here!" : "Upload Resume (PDF)"}
            </p>
            <p className="text-xs text-slate-400 mt-1">Drag & drop or click to browse</p>
          </>
        )}
      </div>

      {/* Resume list */}
      {loading ? (
        <div className="text-center py-8 text-slate-400"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
      ) : resumes.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No resumes uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resumes.map((r) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
              <FileText className="w-8 h-8 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{r.file_name}</p>
                {r.is_default && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mt-0.5">
                    <Star className="w-3 h-3" /> Default
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!r.is_default && (
                  <button
                    onClick={() => setDefault(r.id)}
                    title="Set as default"
                    className="text-xs text-slate-500 hover:text-amber-600 border border-slate-200 px-2 py-1 rounded-lg hover:border-amber-300 transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Set default
                  </button>
                )}
                <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline">View</a>
                <button onClick={() => deleteResume(r)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Experience Tab ─────────────────────────────────────────
function ExperienceTab({ userId }: { userId: string }) {
  const supabase = createClient();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Experience>>({ is_current: false });
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase.from("experiences").select("*").eq("user_id", userId).order("start_date", { ascending: false });
    setExperiences(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("experiences").insert({ user_id: userId, ...form });
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Experience added!");
    setShowForm(false);
    setForm({ is_current: false });
    load();
  }

  async function deleteExp(id: string) {
    await supabase.from("experiences").delete().eq("id", id);
    toast.success("Removed");
    setExperiences((p) => p.filter((e) => e.id !== id));
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <button
        onClick={() => setShowForm((v) => !v)}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add experience
      </button>

      {showForm && (
        <form onSubmit={handleSave} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-medium text-slate-800">New Experience</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Company", key: "company", required: true, placeholder: "Google" },
              { label: "Role / Title", key: "role", required: true, placeholder: "Software Engineer" },
            ].map(({ label, key, required, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
                <input
                  type="text"
                  required={required}
                  value={(form as Record<string, string>)[key] || ""}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Start date</label>
              <input type="date" value={form.start_date || ""} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">End date</label>
              <input type="date" value={form.end_date || ""} disabled={form.is_current} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.is_current || false} onChange={(e) => setForm((p) => ({ ...p, is_current: e.target.checked, end_date: e.target.checked ? null : p.end_date }))} className="accent-blue-600" />
            Currently working here
          </label>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
            <textarea rows={3} value={form.description || ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Key responsibilities and achievements…"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-8 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
      ) : experiences.length === 0 ? (
        <div className="py-8 text-center text-slate-400"><p className="text-sm">No experience added yet.</p></div>
      ) : (
        <div className="space-y-3">
          {experiences.map((exp) => (
            <div key={exp.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800">{exp.role}</p>
                  <p className="text-sm text-slate-600">{exp.company}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {exp.start_date} – {exp.is_current ? "Present" : exp.end_date || ""}
                  </p>
                  {exp.description && <p className="text-sm text-slate-600 mt-2">{exp.description}</p>}
                </div>
                <button onClick={() => deleteExp(exp.id)} className="text-slate-300 hover:text-red-500 shrink-0 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Education Tab ──────────────────────────────────────────
function EducationTab({ userId }: { userId: string }) {
  const supabase = createClient();
  const [educations, setEducations] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Education>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase.from("educations").select("*").eq("user_id", userId).order("end_year", { ascending: false });
    setEducations(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("educations").insert({ user_id: userId, ...form });
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Education added!");
    setShowForm(false);
    setForm({});
    load();
  }

  async function deleteEdu(id: string) {
    await supabase.from("educations").delete().eq("id", id);
    toast.success("Removed");
    setEducations((p) => p.filter((e) => e.id !== id));
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <button onClick={() => setShowForm((v) => !v)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
        <Plus className="w-4 h-4" /> Add education
      </button>

      {showForm && (
        <form onSubmit={handleSave} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-medium text-slate-800">New Education</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Institution *</label>
              <input required type="text" value={form.institution || ""} onChange={(e) => setForm((p) => ({ ...p, institution: e.target.value }))} placeholder="IIT Bombay"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Degree *</label>
              <input required type="text" value={form.degree || ""} onChange={(e) => setForm((p) => ({ ...p, degree: e.target.value }))} placeholder="B.Tech"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Field of study</label>
              <input type="text" value={form.field_of_study || ""} onChange={(e) => setForm((p) => ({ ...p, field_of_study: e.target.value }))} placeholder="Computer Science"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Start year</label>
                <input type="number" min="1980" max="2030" value={form.start_year || ""} onChange={(e) => setForm((p) => ({ ...p, start_year: +e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">End year</label>
                <input type="number" min="1980" max="2030" value={form.end_year || ""} onChange={(e) => setForm((p) => ({ ...p, end_year: +e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-8 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
      ) : educations.length === 0 ? (
        <div className="py-8 text-center text-slate-400"><p className="text-sm">No education added yet.</p></div>
      ) : (
        <div className="space-y-3">
          {educations.map((edu) => (
            <div key={edu.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-800">{edu.degree}{edu.field_of_study ? ` in ${edu.field_of_study}` : ""}</p>
                <p className="text-sm text-slate-600">{edu.institution}</p>
                {(edu.start_year || edu.end_year) && (
                  <p className="text-xs text-slate-400 mt-1">{edu.start_year} – {edu.end_year || "Present"}</p>
                )}
              </div>
              <button onClick={() => deleteEdu(edu.id)} className="text-slate-300 hover:text-red-500 shrink-0 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Email Settings Tab ────────────────────────────────────
function EmailSettingsTab({ userId }: { userId: string }) {
  const supabase = createClient();
  const [gmailUser, setGmailUser] = useState("");
  const [gmailPass, setGmailPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasCredentials, setHasCredentials] = useState(false);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("gmail_user, gmail_app_password")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (data?.gmail_user) {
          setGmailUser(data.gmail_user);
          setHasCredentials(true);
        }
        setLoading(false);
      });
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!gmailUser || !gmailPass) { toast.error("Both fields are required"); return; }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ gmail_user: gmailUser, gmail_app_password: gmailPass, updated_at: new Date().toISOString() })
      .eq("id", userId);
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Gmail credentials saved!");
    setHasCredentials(true);
    setGmailPass("");
  }

  async function handleRemove() {
    await supabase.from("profiles").update({ gmail_user: null, gmail_app_password: null }).eq("id", userId);
    setGmailUser("");
    setGmailPass("");
    setHasCredentials(false);
    toast.success("Gmail credentials removed");
  }

  if (loading) return <div className="py-12 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin inline" /></div>;

  return (
    <div className="space-y-6 max-w-lg">
      {/* Status banner */}
      {hasCredentials ? (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <Check className="w-4 h-4" />
            <span>Gmail configured: <strong>{gmailUser}</strong></span>
          </div>
          <button onClick={handleRemove} className="text-xs text-red-500 hover:underline">Remove</button>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          ⚠️ No Gmail configured — emails cannot be sent until you add credentials below.
        </div>
      )}

      {/* How-to guide */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm space-y-2">
        <p className="font-semibold text-slate-700">How to get a Gmail App Password</p>
        <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
          <li>Go to your <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">Google Account → Security <ExternalLink className="w-3 h-3" /></a></li>
          <li>Enable <strong>2-Step Verification</strong> if not already on</li>
          <li>Search for <strong>&ldquo;App passwords&rdquo;</strong> in your Google account</li>
          <li>Create a new app password → choose <strong>Mail</strong></li>
          <li>Copy the <strong>16-character password</strong> and paste it below</li>
        </ol>
        <p className="text-xs text-slate-400 pt-1">Your App Password is different from your regular Gmail password. It&apos;s stored securely and only visible to you.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Gmail address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              required
              value={gmailUser}
              onChange={(e) => setGmailUser(e.target.value)}
              placeholder="you@gmail.com"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            App Password <span className="text-slate-400 font-normal">(16 characters, no spaces)</span>
          </label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              required
              value={gmailPass}
              onChange={(e) => setGmailPass(e.target.value.replace(/\s/g, ""))}
              placeholder={hasCredentials ? "Enter new password to update" : "xxxx xxxx xxxx xxxx"}
              maxLength={16}
              className="w-full pr-10 pl-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {gmailPass.length > 0 && gmailPass.length < 16 && (
            <p className="text-xs text-amber-600 mt-1">{16 - gmailPass.length} more characters needed</p>
          )}
          {gmailPass.length === 16 && (
            <p className="text-xs text-green-600 mt-1">✓ Length looks correct</p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving || gmailPass.length !== 16}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {hasCredentials ? "Update credentials" : "Save credentials"}
        </button>
      </form>
    </div>
  );
}

// ── Main profile page ─────────────────────────────────────
export default function ProfilePage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("personal");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "personal", label: "Personal Info", icon: User },
    { key: "resume", label: "Resume", icon: FileText },
    { key: "experience", label: "Experience", icon: Briefcase },
    { key: "education", label: "Education", icon: GraduationCap },
    { key: "email", label: "Email Settings", icon: Mail },
  ];

  if (!userId) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your personal info, resume, and experience.</p>
      </div>

      {/* Tabs — horizontally scrollable on mobile */}
      <div className="overflow-x-auto scrollbar-none mb-5 sm:mb-6 -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit min-w-full sm:min-w-0">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        {activeTab === "personal" && <PersonalTab userId={userId} />}
        {activeTab === "resume" && <ResumeTab userId={userId} />}
        {activeTab === "experience" && <ExperienceTab userId={userId} />}
        {activeTab === "education" && <EducationTab userId={userId} />}
        {activeTab === "email" && <EmailSettingsTab userId={userId} />}
      </div>
    </div>
  );
}
