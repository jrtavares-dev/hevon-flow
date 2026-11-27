import { getCurrentAdmin } from '@/lib/auth';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';

export default async function AdminLayout({ children }) {
  const admin = await getCurrentAdmin();

  // If user is not logged in (e.g., viewing /admin/login), render without admin shell
  if (!admin) {
    return <>{children}</>;
  }

  return (
    <div className="hevon-admin-shell d-flex w-100 position-relative">
      <AdminSidebar admin={admin} />
      <div className="main-content hevon-main-content">
        <AdminHeader admin={admin} />
        <main className="hevon-page-container">{children}</main>
      </div>
    </div>
  );
}
