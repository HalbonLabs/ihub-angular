import { UserRole } from '../../core/models/auth.model';

export interface NavigationItem {
  id: string;
  title: string;
  icon: string;
  route?: string;
  badge?: string | number;
  badgeColor?: string;
  children?: NavigationItem[];
  roles?: UserRole[];
  permission?: string;
  divider?: boolean;
}

export const NAVIGATION_CONFIG: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: 'dashboard',
    route: '/dashboard',
    roles: [UserRole.ADMIN, UserRole.INSPECTOR, UserRole.VIEWER]
  },
  {
    id: 'inspections',
    title: 'Inspections',
    icon: 'assignment',
    roles: [UserRole.ADMIN, UserRole.INSPECTOR, UserRole.VIEWER],
    children: [
      {
        id: 'inspections-list',
        title: 'All Inspections',
        icon: 'list',
        route: '/inspections',
      },
      {
        id: 'inspections-create',
        title: 'New Inspection',
        icon: 'add_circle',
        route: '/inspections/create',
        roles: [UserRole.ADMIN, UserRole.INSPECTOR]
      },
      {
        id: 'inspections-schedule',
        title: 'Schedule',
        icon: 'calendar_month',
        route: '/inspections/schedule',
      },
      {
        id: 'inspections-defects',
        title: 'Defects',
        icon: 'warning',
        route: '/inspections/defects',
        badge: '3',
        badgeColor: 'warn'
      }
    ]
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: 'assessment',
    roles: [UserRole.ADMIN, UserRole.INSPECTOR, UserRole.VIEWER],
    children: [
      {
        id: 'reports-generate',
        title: 'Generate Report',
        icon: 'file_copy',
        route: '/reports/generate',
        roles: [UserRole.ADMIN, UserRole.INSPECTOR]
      },
      {
        id: 'reports-templates',
        title: 'Templates',
        icon: 'description',
        route: '/reports/templates',
      },
      {
        id: 'reports-analytics',
        title: 'Analytics',
        icon: 'analytics',
        route: '/reports/analytics',
      }
    ]
  },
  {
    id: 'files',
    title: 'Files',
    icon: 'folder',
    route: '/files',
    roles: [UserRole.ADMIN, UserRole.INSPECTOR, UserRole.VIEWER]
  },
  {
    id: 'divider-1',
    title: '',
    icon: '',
    divider: true
  },
  {
    id: 'users',
    title: 'Users',
    icon: 'people',
    route: '/users',
    roles: [UserRole.ADMIN],
    badge: 'NEW',
    badgeColor: 'accent'
  },
  {
    id: 'admin',
    title: 'Administration',
    icon: 'admin_panel_settings',
    roles: [UserRole.ADMIN],
    children: [
      {
        id: 'admin-organizations',
        title: 'Organizations',
        icon: 'business',
        route: '/admin/organizations'
      },
      {
        id: 'admin-settings',
        title: 'System Settings',
        icon: 'settings',
        route: '/admin/settings'
      },
      {
        id: 'admin-audit',
        title: 'Audit Log',
        icon: 'history',
        route: '/admin/audit'
      },
      {
        id: 'admin-backup',
        title: 'Backup & Restore',
        icon: 'backup',
        route: '/admin/backup'
      }
    ]
  },
  {
    id: 'divider-2',
    title: '',
    icon: '',
    divider: true
  },
  {
    id: 'help',
    title: 'Help & Support',
    icon: 'help_outline',
    children: [
      {
        id: 'help-docs',
        title: 'Documentation',
        icon: 'menu_book',
        route: '/help/docs'
      },
      {
        id: 'help-tutorials',
        title: 'Video Tutorials',
        icon: 'play_circle',
        route: '/help/tutorials'
      },
      {
        id: 'help-support',
        title: 'Contact Support',
        icon: 'support_agent',
        route: '/help/support'
      }
    ]
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'settings',
    route: '/settings'
  }
];

/**
 * Filter navigation items based on user role
 */
export function filterNavigationByRole(items: NavigationItem[], userRole: UserRole | null): NavigationItem[] {
  if (!userRole) return [];
  
  return items.filter(item => {
    // If no roles specified, item is available to all
    if (!item.roles || item.roles.length === 0) return true;
    
    // Check if user has required role
    const hasRole = item.roles.includes(userRole);
    
    // If item has children, filter them recursively
    if (hasRole && item.children) {
      item.children = filterNavigationByRole(item.children, userRole);
    }
    
    return hasRole;
  });
}