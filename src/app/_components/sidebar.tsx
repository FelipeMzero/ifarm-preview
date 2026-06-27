import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Beef } from 'lucide-react';

const NAV = [
  { href: '/animais', label: 'Animais', icon: Beef },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-white flex flex-col py-4 px-3 gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const ativo = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              ativo
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </aside>
  );
}