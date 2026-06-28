"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { extractEmails, extractPhones, parseJobDetails } from "@/lib/ocr-utils";
import { buildEmailDraft } from "@/lib/email-template";
import {
  Image as ImageIcon,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  ChevronDown,
  ChevronUp,
  Send,
  Plus,
  X,
  ScanText,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { ExtractedJobData, Profile } from "@/types";

function SendEmailModal({
  email,
  jobTitle,
  companyName,
  jobPostingId,
  onClose,
  onSent,
}: {
  email: string;
  jobTitle: string | null;
  companyName: string | null;
  jobPostingId: string | null;
  onClose: () => void;
  onSent: () => void;
}) {
  const supabase = createClient();
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Partial<Profile> | null>(null);
  const [fallbackEmail, setFallbackEmail] = useState<string | null>(null);
  const [recruiterName, setRecruiterName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Load profile + build the initial draft on open
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let prof: Partial<Profile> | null = null;
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        prof = data;
      }
      setProfile(prof);
      setFallbackEmail(user?.email ?? null);
      const draft = buildEmailDraft({
        profile: prof,
        jobTitle,
        companyName,
        fallbackEmail: user?.email,
      });
      setSubject(draft.subject);
      setBody(draft.body);
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update only the greeting line when recruiter name changes (preserves edits)
  function handleRecruiterChange(val: string) {
    setRecruiterName(val);
    setBody((prev) => {
      const lines = prev.split("\n");
      if (lines[0]?.startsWith("Hi ")) {
        lines[0] = `Hi ${val.trim() || "there"},`;
      }
      return lines.join("\n");
    });
  }

  function resetDraft() {
    const draft = buildEmailDraft({
      profile,
      recruiterName,
      jobTitle,
      companyName,
      fallbackEmail,
    });
    setSubject(draft.subject);
    setBody(draft.body);
    toast.success("Draft reset to template");
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and message cannot be empty");
      return;
    }
    setSending(true);
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to_email: email,
        subject,
        body,
        job_posting_id: jobPostingId,
      }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      toast.error(data.error || "Failed to send email");
    } else {
      toast.success(`Email sent to ${email}!`);
      onSent();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Send Application Email</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin inline" /> Building draft…
          </div>
        ) : (
          <div className="space-y-4">
            {/* To */}
            <div className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2.5">
              <span className="text-slate-400">To:</span>
              <span className="font-medium text-slate-800">{email}</span>
            </div>

            {/* Recruiter name */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Recruiter&apos;s first name <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={recruiterName}
                onChange={(e) => handleRecruiterChange(e.target.value)}
                placeholder="e.g. Harshit"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-600">Message</label>
                <button
                  type="button"
                  onClick={resetDraft}
                  className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset to template
                </button>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={13}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-mono"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Your resume will be attached automatically. Replies go to your Gmail.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 border border-slate-200 text-slate-700 text-sm py-2.5 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 bg-blue-600 text-white text-sm py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Email</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UploadPage() {
  const supabase = createClient();

  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("");
  const [extracted, setExtracted] = useState<ExtractedJobData | null>(null);
  const [jobPostingId, setJobPostingId] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [emailModal, setEmailModal] = useState<{ email: string } | null>(null);
  const [addedPhones, setAddedPhones] = useState<Set<string>>(new Set());
  const [sentEmails, setSentEmails] = useState<Set<string>>(new Set());

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setImageFile(file);
    setExtracted(null);
    setJobPostingId(null);
    setAddedPhones(new Set());
    setSentEmails(new Set());
    setOcrProgress(0);
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  async function handleExtract() {
    if (!imageFile) return;
    setExtracting(true);
    setOcrProgress(0);
    setOcrStatus("Loading OCR engine…");

    try {
      // Dynamically import so the WASM only loads when needed
      const Tesseract = (await import("tesseract.js")).default;

      const result = await Tesseract.recognize(imageFile, "eng", {
        logger: (m) => {
          if (m.status === "loading tesseract core") setOcrStatus("Loading OCR engine…");
          if (m.status === "initializing tesseract") setOcrStatus("Initialising…");
          if (m.status === "loading language traineddata") setOcrStatus("Loading language data…");
          if (m.status === "recognizing text") {
            setOcrStatus("Reading text…");
            setOcrProgress(Math.round((m.progress as number) * 100));
          }
        },
      });

      const raw_text = result.data.text;
      const emails = extractEmails(raw_text);
      const phones = extractPhones(raw_text);
      const { job_title, company_name, location } = parseJobDetails(raw_text);

      const data: ExtractedJobData = { raw_text, emails, phones, job_title, company_name, location };
      setExtracted(data);

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let imageUrl: string | null = null;
        const fileName = `${user.id}/${Date.now()}_${imageFile.name}`;
        const { data: upload } = await supabase.storage.from("job-screenshots").upload(fileName, imageFile);
        if (upload) {
          const { data: urlData } = supabase.storage.from("job-screenshots").getPublicUrl(upload.path);
          imageUrl = urlData.publicUrl;
        }

        const { data: posting } = await supabase.from("job_postings").insert({
          user_id: user.id,
          image_url: imageUrl,
          raw_text,
          company_name,
          job_title,
          emails,
          phones,
          location,
        }).select("id").single();

        if (posting) setJobPostingId(posting.id);
      }

      if (emails.length === 0 && phones.length === 0) {
        toast.warning("No emails or phone numbers found. Try a clearer screenshot.");
      } else {
        toast.success(`Found ${emails.length} email${emails.length !== 1 ? "s" : ""} and ${phones.length} phone${phones.length !== 1 ? "s" : ""}!`);
      }
    } catch (err) {
      console.error("OCR error:", err);
      toast.error("OCR failed. Please try again with a clearer image.");
    } finally {
      setExtracting(false);
      setOcrProgress(0);
      setOcrStatus("");
    }
  }

  async function addToCallList(phone: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("call_todos").insert({
      user_id: user.id,
      job_posting_id: jobPostingId,
      phone,
      company_name: extracted?.company_name,
    });
    if (error) { toast.error("Failed to add to call list"); return; }
    toast.success("Added to call list!");
    setAddedPhones((prev) => new Set(prev).add(phone));
  }

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Upload Job Screenshot</h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload a screenshot of a job posting to extract contact details and send your application.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upload */}
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
            }`}
          >
            <input {...getInputProps()} />
            {image ? (
              <div className="space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Job screenshot" className="max-h-64 mx-auto rounded-lg object-contain" />
                <p className="text-xs text-slate-500">{imageFile?.name} · Click to replace</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mx-auto">
                  <ImageIcon className="w-7 h-7 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-700">{isDragActive ? "Drop it here!" : "Drop screenshot here"}</p>
                  <p className="text-sm text-slate-400 mt-1">or click to browse · PNG, JPG, WEBP</p>
                </div>
              </div>
            )}
          </div>

          {image && !extracting && (
            <button
              onClick={handleExtract}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <ScanText className="w-4 h-4" />
              Extract Information
            </button>
          )}

          {extracting && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-blue-700">
                <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin shrink-0" />
                <span className="text-sm font-medium">{ocrStatus || "Processing…"}</span>
              </div>
              {ocrProgress > 0 && (
                <div className="space-y-1">
                  <div className="w-full bg-blue-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-600 text-right">{ocrProgress}%</p>
                </div>
              )}
              <p className="text-xs text-blue-500">Running locally in your browser — no API key needed</p>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {!extracted && !extracting && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
              <ScanText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">Extracted information will appear here</p>
            </div>
          )}

          {extracted && (
            <div className="space-y-4">
              {/* Meta */}
              {(extracted.job_title || extracted.company_name || extracted.location) && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
                  {extracted.job_title && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800">{extracted.job_title}</span>
                    </div>
                  )}
                  {extracted.company_name && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-700">{extracted.company_name}</span>
                    </div>
                  )}
                  {extracted.location && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-700">{extracted.location}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Emails */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-slate-800">Emails Found ({extracted.emails.length})</span>
                </div>
                {extracted.emails.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-slate-400">No emails detected</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {extracted.emails.map((email) => (
                      <div key={email} className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm text-slate-700 truncate">{email}</span>
                        <button
                          onClick={() => setEmailModal({ email })}
                          disabled={sentEmails.has(email)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ml-3 shrink-0 ${
                            sentEmails.has(email)
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          {sentEmails.has(email) ? "Sent ✓" : "Send Email"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Phones */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-800">Phone Numbers ({extracted.phones.length})</span>
                </div>
                {extracted.phones.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-slate-400">No phone numbers detected</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {extracted.phones.map((phone) => (
                      <div key={phone} className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm text-slate-700">{phone}</span>
                        <button
                          onClick={() => addToCallList(phone)}
                          disabled={addedPhones.has(phone)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ml-3 shrink-0 flex items-center gap-1 ${
                            addedPhones.has(phone)
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {addedPhones.has(phone) ? "Added ✓" : <><Plus className="w-3 h-3" /> Call List</>}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Raw text */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowRaw((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span>Raw extracted text</span>
                  {showRaw ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {showRaw && (
                  <div className="px-4 pb-4">
                    <pre className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {extracted.raw_text || "No text extracted"}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {emailModal && (
        <SendEmailModal
          email={emailModal.email}
          jobTitle={extracted?.job_title ?? null}
          companyName={extracted?.company_name ?? null}
          jobPostingId={jobPostingId}
          onClose={() => setEmailModal(null)}
          onSent={() => setSentEmails((prev) => new Set(prev).add(emailModal.email))}
        />
      )}
    </div>
  );
}
