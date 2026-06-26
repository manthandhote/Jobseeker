import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Upload, Mail, Phone, CheckCircle2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { count: screenshotCount },
    { count: emailCount },
    { count: pendingCount },
    { count: doneCount },
    { data: recentPostings },
    { data: recentEmails },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("job_postings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("email_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("call_todos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_done", false),
    supabase
      .from("call_todos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_done", true),
    supabase
      .from("job_postings")
      .select("id, company_name, job_title, emails, phones, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("email_logs")
      .select("id, to_email, subject, sent_at, status")
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false })
      .limit(5),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
  ]);

  const name = profile?.full_name || user.email?.split("@")[0] || "there";

  const stats = [
    { label: "Screenshots Processed", value: screenshotCount ?? 0, icon: Upload, color: "bg-blue-50 text-blue-600" },
    { label: "Emails Sent", value: emailCount ?? 0, icon: Mail, color: "bg-green-50 text-green-600" },
    { label: "Calls Pending", value: pendingCount ?? 0, icon: Phone, color: "bg-orange-50 text-orange-600" },
    { label: "Calls Completed", value: doneCount ?? 0, icon: CheckCircle2, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {name} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Here&apos;s a summary of your job search activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Job Postings */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">
              Recent Screenshots
            </h2>
            <Link href="/upload" className="text-xs text-blue-600 hover:underline">
              Upload new →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentPostings && recentPostings.length > 0 ? (
              recentPostings.map((p) => (
                <div key={p.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-slate-800">
                    {p.job_title || "Unknown position"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.company_name || "Unknown company"} · {formatDateTime(p.created_at)}
                  </p>
                  <div className="flex gap-2 mt-1.5">
                    {p.emails?.length > 0 && (
                      <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                        {p.emails.length} email{p.emails.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {p.phones?.length > 0 && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                        {p.phones.length} phone{p.phones.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">
                No screenshots yet.{" "}
                <Link href="/upload" className="text-blue-600 hover:underline">
                  Upload one now!
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Emails */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Emails Sent</h2>
            <Link href="/history" className="text-xs text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentEmails && recentEmails.length > 0 ? (
              recentEmails.map((e) => (
                <div key={e.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {e.to_email}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{e.subject}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDateTime(e.sent_at)}
                  </p>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">
                No emails sent yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/upload"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Screenshot
        </Link>
        <Link
          href="/todos"
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Phone className="w-4 h-4" />
          View Call List
        </Link>
        <Link
          href="/profile"
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Update Profile
        </Link>
      </div>
    </div>
  );
}
