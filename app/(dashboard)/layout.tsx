import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ToastProvider } from "@/components/ui/Toast";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DashboardLayout userName="Alex" userRole="FOUNDER" plan="pro">
        {children}
      </DashboardLayout>
    </ToastProvider>
  );
}
