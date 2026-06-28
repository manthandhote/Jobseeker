import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      {/*
        Offsets:
          pt-14      — mobile top-bar height (56px)
          pb-20      — mobile bottom-nav height (64px) + extra breathing room
          md:pt-0    — tablet/desktop: sidebar is on the left, no top offset needed
          md:pb-0    — no bottom nav on md+
          md:ml-16   — tablet icon-sidebar width (64px)
          lg:ml-60   — desktop full-sidebar width (240px)
      */}
      <main className="pt-14 pb-20 md:pt-0 md:pb-0 md:ml-16 lg:ml-60 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
