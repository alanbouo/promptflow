'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, ChevronDown } from 'lucide-react';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (status === 'loading') {
    return (
      <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
    );
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-lg transition-colors hover:bg-accent hover:text-foreground"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg transition-colors hover:bg-primary/90"
        >
          Get Started
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-sm">
          {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="text-sm font-medium text-foreground hidden sm:block">
          {session.user.name || session.user.email}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-popover rounded-lg shadow-lg border py-1 z-50">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-medium text-popover-foreground">{session.user.name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
            {session.user.role === 'admin' && (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground rounded">
                Admin
              </span>
            )}
          </div>
          
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-popover-foreground hover:bg-accent transition-colors"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          
          <button
            onClick={() => {
              setIsOpen(false);
              signOut({ callbackUrl: '/login' });
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-popover-foreground hover:bg-accent transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
