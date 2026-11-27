import './globals.css';
import '@/styles/hevon.css';
import StyledJsxRegistry from './registry';

export const dynamic = 'force-dynamic';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: 'HEVON FLOW · Funis, Presells & Gamificação',
  description: 'Plataforma modular de funis de upsell, páginas presell de alta conversão e gamificação.',
  icons: {
    icon: '/images/hevon-flow-logo.png',
    apple: '/images/hevon-flow-logo.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('upsellflow_theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');document.documentElement.classList.add('dark');}else{document.documentElement.setAttribute('data-theme','light');document.documentElement.classList.remove('dark');}}catch(e){}window.addEventListener('error',function(e){var m=(e&&e.message)||'';if(m.indexOf('ChunkLoadError')!==-1||m.indexOf('Loading chunk')!==-1||m.indexOf('Failed to fetch dynamically imported module')!==-1){var k='uf_chunk_reload_ts';var last=sessionStorage.getItem(k);var now=Date.now();if(!last||(now-Number(last))>8000){sessionStorage.setItem(k,String(now));window.location.reload();}}});})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <StyledJsxRegistry>{children}</StyledJsxRegistry>
      </body>
    </html>
  );
}
