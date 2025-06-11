'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export default function SessionWrapper({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
export const dynamic = 'force-dynamic'; // Ensures the session is always fresh
export const revalidate = 0; // Disable static generation for this component