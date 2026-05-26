import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ToastProvider } from "@/components/ui/Toast";

export default async function Layout({ children }: { children: React.ReactNode }) {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    // Continue with null session if getServerSession fails
  }

  const userName = session?.user?.name ?? "User";
  const userRole = (session?.user?.role as "FOUNDER" | "INVESTOR" | "EXECUTIVE") ?? "FOUNDER";

  return (
    <ToastProvider>
      <DashboardLayout userName={userName} userRole={userRole} plan="pro">
        {children}
      </DashboardLayout>
    </ToastProvider>
  );
}
