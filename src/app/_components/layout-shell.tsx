'use client';
import { ReactNode } from 'react';
import { Sidebar } from './sidebar';

export default function LayoutShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}