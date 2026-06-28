import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Mail, CheckCircle2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: logs } = await supabase
    .from("email_logs")
    .select("*, job_postings(company_name, job_title)")
    .eq("user_id", user.id)
    .order("sent_at", { ascending: false });

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Email History</h1>
        <p className="text-slate-500 text-sm mt-1">
          All application emails you&apos;ve sent through the app.
        </p>
      </div>

      {!logs || logs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-20 text-center">
          <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No emails sent yet</p>
          <p className="text-slate-400 text-sm mt-1">
            Upload a job screenshot and send your first application!
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-12 text-xs font-medium text-slate-500 uppercase tracking-wide">
            <span className="col-span-5">Recipient</span>
            <span className="col-span-4">Subject</span>
            <span className="col-span-2">Sent</span>
            <span className="col-span-1">Status</span>
          </div>
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="px-5 py-4 grid grid-cols-12 gap-2 items-center hover:bg-slate-50 transition-colors">
                <div className="col-span-5 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{log.to_email}</p>
                  {log.job_postings && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(log.job_postings as any).job_title} · {(log.job_postings as any).company_name}
                    </p>
                  )}
                </div>
                <div className="col-span-4 min-w-0">
                  <p className="text-sm text-slate-600 truncate">{log.subject}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-400">{formatDateTime(log.sent_at)}</p>
                </div>
                <div className="col-span-1">
                  <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
            {logs.length} email{logs.length !== 1 ? "s" : ""} sent total
          </div>
        </div>
      )}
    </div>
  );
}
