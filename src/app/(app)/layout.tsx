import { AppSidebar as Sidebar } from "@/components/app/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-background">
        <Sidebar />
      </aside>

      {/* Contenido */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}