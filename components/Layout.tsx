import { Header } from './Header';
import { ReactNode } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <Header />
      <main>{children}</main>
    </div>
  );
} 