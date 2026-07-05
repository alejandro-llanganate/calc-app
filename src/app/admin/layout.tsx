import { AdminAuthProvider, AdminGuard } from "@/components/admin/AdminAuthProvider";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminGuard>
        <AdminShell>{children}</AdminShell>
      </AdminGuard>
    </AdminAuthProvider>
  );
}
