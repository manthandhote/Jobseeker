export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  linkedin_url: string | null;
  summary: string | null;
  headline: string | null;
  years_experience: string | null;
  key_skills: string | null;
  key_achievement: string | null;
  portfolio_url: string | null;
  gmail_user: string | null;
  gmail_app_password: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  is_default: boolean;
  created_at: string;
}

export interface Experience {
  id: string;
  user_id: string;
  company: string;
  role: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  created_at: string;
}

export interface Education {
  id: string;
  user_id: string;
  institution: string;
  degree: string;
  field_of_study: string | null;
  start_year: number | null;
  end_year: number | null;
  created_at: string;
}

export interface JobPosting {
  id: string;
  user_id: string;
  image_url: string | null;
  raw_text: string | null;
  company_name: string | null;
  job_title: string | null;
  emails: string[];
  phones: string[];
  location: string | null;
  created_at: string;
}

export interface CallTodo {
  id: string;
  user_id: string;
  job_posting_id: string | null;
  phone: string;
  recruiter_name: string | null;
  company_name: string | null;
  notes: string | null;
  is_done: boolean;
  called_at: string | null;
  created_at: string;
}

export interface EmailLog {
  id: string;
  user_id: string;
  job_posting_id: string | null;
  to_email: string;
  subject: string | null;
  sent_at: string;
  status: string;
}

export interface ExtractedJobData {
  raw_text: string;
  emails: string[];
  phones: string[];
  company_name: string | null;
  job_title: string | null;
  location: string | null;
}
