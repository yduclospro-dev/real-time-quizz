"use client";

import { usePathname } from 'next/navigation';
import { Header } from './Header';

export function HeaderWrapper() {
  const pathname = usePathname();

  // Do not render the header on auth pages
  if (pathname === '/login' || pathname === '/register') return null;

  return <Header />;
}
