import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { queryOne } from '@/lib/db';
import PublicOfferPage from './o/[token]/page';

export const metadata = {
  title: 'HEVON FLOW · Sistema de Funil & Presell',
  description: 'Plataforma completa de upsell de 1 clique, presells de alta conversão, tracking avançado e cloaker.',
};

export default async function HomePage() {
  const headersList = await headers();
  const host = (headersList.get('host') || '').replace(/:\d+$/, '').toLowerCase();
  const userAgent = headersList.get('user-agent') || '';

  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    try {
      const custom = await queryOne(
        `SELECT c.slug FROM custom_domains cd 
         JOIN campaigns c ON cd.campaign_id = c.id 
         WHERE cd.domain = ? AND cd.status = 'active' LIMIT 1`,
        [host]
      );

      if (custom?.slug) {
        return <PublicOfferPage params={Promise.resolve({ token: custom.slug })} />;
      }
    } catch (e) {
      console.warn('Custom domain query fallback:', e?.message || e);
    }
  }

  // Permite que crawlers de verificação de domínio (Meta / Google) leiam as <meta> tags do <head> na raiz com HTTP 200
  if (/facebookexternalhit|facebot|meta-externalagent|google-site-verification/i.test(userAgent)) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <p>UpsellFlow</p>
      </main>
    );
  }

  redirect('/admin');
}
