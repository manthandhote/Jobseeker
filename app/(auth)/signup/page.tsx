"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  Briefcase,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  MailCheck,
  Upload,
  Phone,
  History,
} from "lucide-react";

const features = [
  { icon: Upload, text: "OCR screenshot → extract recruiter emails & phones" },
  { icon: Mail, text: "Send personalised application emails from your Gmail" },
  { icon: Phone, text: "Track recruiter calls with a built-in to-do list" },
  { icon: History, text: "Full history of every email you've sent" },
];

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
      });
    }

    setLoading(false);

    if (data.session) {
      toast.success("Account created! Welcome aboard.");
      router.push("/dashboard");
      router.refresh();
    } else {
      setAwaitingConfirm(true);
    }
  }

  if (awaitingConfirm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-green-100">
            <MailCheck className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            We sent a confirmation link to{" "}
            <span className="font-semibold text-slate-700">{email}</span>.
            Click it to activate your account, then come back to sign in.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — visible on md+ ── */}
      <div className="hidden md:flex flex-col justify-between w-[45%] lg:w-2/5 bg-slate-900 p-10 lg:p-14 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">JobSeeker Pro</span>
        </div>

        {/* Value props */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white leading-snug">
              Your job search,<br />
              <span className="text-blue-400">supercharged.</span>
            </h2>
            <p className="text-slate-400 mt-3 text-sm leading-relaxed">
              Create your free account and go from job posting screenshot to sent application in seconds.
            </p>
          </div>

          <ul className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{text}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-slate-600 text-xs">
          © {new Date().getFullYear()} JobSeeker Pro
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="flex flex-col items-center mb-8 md:hidden">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-200">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">JobSeeker Pro</h1>
            <p className="text-slate-500 mt-1 text-sm">Create your free account</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden md:block mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="text-slate-500 mt-1 text-sm">Free forever. No credit card required.</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7 sm:p-8">
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Adesh Dhage"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-sm shadow-blue-200"
              >
                {loading ? "Creating account…" : "Create free account"}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
