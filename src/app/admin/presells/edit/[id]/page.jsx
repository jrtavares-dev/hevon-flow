import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { getPresellById } from '@/lib/models/presell';
import PresellForm from '@/components/PresellForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function EditPresellPage({ params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect('/admin/login');
  }

  const resolvedParams = await params;
  const id = resolvedParams?.id;

  let presell = null;
  if (id) {
    try {
      presell = await getPresellById(id);
    } catch (err) {
      console.error('Error fetching presell for edit:', err);
    }
  }

  if (!presell) {
    redirect('/admin/presells');
  }

  // Sanitize to a plain object to guarantee Next.js React Flight serialization
  // never fails on Date objects or database prototypes
  const safePresell = JSON.parse(JSON.stringify(presell));

  return <PresellForm initialData={safePresell} isEdit={true} />;
}
