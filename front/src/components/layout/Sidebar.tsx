import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tags,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VERSION } from '@/lib/version';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Assets', href: '/assets', icon: Package },
  { label: 'Categories', href: '/categories', icon: FolderTree },
  { label: 'Tags', href: '/tags', icon: Tags },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  currentPath: string;
}

export function Sidebar({ currentPath }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-14 items-center justify-between px-4 border-b border-border">
        {!collapsed && <span className="text-lg font-bold tracking-tight">Strata</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1 hover:bg-sidebar-accent cursor-pointer"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </a>
          );
        })}
      </nav>

      <div
        className={cn(
          'border-t border-border px-3 py-2 text-xs text-muted-foreground',
          collapsed && 'text-center'
        )}
        title={`${VERSION.version} (${VERSION.env}) — ${VERSION.gitSha}`}
      >
        {collapsed ? (
          <span aria-label="Version">v</span>
        ) : (
          <span>
            v{VERSION.version}
            {VERSION.env === 'development' && (
              <span className="ml-1 rounded bg-amber-500/15 px-1 text-amber-700 dark:text-amber-400">
                DEV
              </span>
            )}
          </span>
        )}
      </div>
    </aside>
  );
}
