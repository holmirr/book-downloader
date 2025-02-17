'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const navigation = [
  { name: 'ダッシュボード', href: '/dashboard' },
  { name: '残り', href: '/dashboard/remain' },
  { name: 'ダウンロード', href: '/dashboard/download' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* モバイル用ハンバーガーメニュー */}
      <button
        onClick={toggleSidebar}
        className="fixed left-4 top-4 z-50 rounded-md bg-gray-100 p-2 shadow-md md:hidden"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-gray-900" />
        ) : (
          <Menu className="h-6 w-6 text-gray-900" />
        )}
      </button>

      {/* オーバーレイ背景 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* サイドバー */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full w-56 transform bg-gray-900 transition-transform duration-300 ease-in-out',
          'md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'shadow-xl'
        )}
      >
        <div className="flex h-16 items-center justify-center border-b border-gray-800">
          <h1 className="font-bold text-white text-sm sm:text-base md:text-lg lg:text-xl pt-14 md:pt-0 px-2">Book Downloader</h1>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <div key={item.name}>
                {isActive ? (
                  <span
                    className={cn(
                      'flex w-full cursor-not-allowed items-center rounded-md px-4 py-2',
                      'bg-gray-800 text-white'
                    )}
                  >
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex w-full items-center rounded-md px-4 py-2',
                      'text-gray-300 hover:bg-gray-800 hover:text-white'
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </div>
  );
} 