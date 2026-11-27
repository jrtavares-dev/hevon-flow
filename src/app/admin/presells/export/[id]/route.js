import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'tudo';
  redirect(`/api/admin/presells/export?id=${id}&period=${period}`);
}
