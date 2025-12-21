"use client";

import { usePathname } from 'next/navigation';
import { Header } from './Header';

export function HeaderWrapper() {
  const pathname = usePathname();

  // Do not render the header on these pages (they have custom headers)
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/quiz/new' ||
    pathname?.startsWith('/quiz/') && pathname?.includes('/session')
  ) {
    return null;
  }

  // Do not render on quiz edit pages (/quiz/[id])
  if (pathname?.match(/^\/quiz\/[^/]+$/)) {
    return null;
  }

  // Set title based on pathname
  let title = '';
  if (pathname === '/join') title = 'Rejoindre une session';
  if (pathname === '/quiz') title = 'Mes quiz';
  if (pathname === '/history') title = 'Historique';

  return <Header title={title} />;
}
