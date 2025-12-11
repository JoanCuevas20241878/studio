import { DashboardClient } from '@/components/dashboard/dashboard-client';

export default function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8">
      <DashboardClient />
    </div>
  );
}
