import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Beef } from 'lucide-react';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const NAV = [
  { href: '/animal', label: 'Animais', icon: Beef },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <SidebarPrimitive>
      <SidebarHeader>
        <span className="px-2 py-1 text-sm font-semibold">iFarm</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {NAV.map(({ href, label, icon: Icon }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton asChild isActive={pathname.startsWith(href)}>
                <Link href={href}>
                  <Icon />
                  <span>{label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </SidebarPrimitive>
  );
}
