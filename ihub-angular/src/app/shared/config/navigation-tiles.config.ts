import { NavigationTile } from '../components/tile-card/tile-card.component';

export const navigationTiles: NavigationTile[] = [
  {
    path: '/',
    icon: 'fas fa-home',
    title: 'Homepage',
    subtitle: 'Navigate to the main homepage',
    color: 'from-blue-500 to-blue-600',
    description: 'Navigate to the main homepage'
  },
  {
    path: '/dashboard/detailed',
    icon: 'fas fa-chart-line',
    title: 'Dashboard',
    subtitle: 'View main dashboard with statistics and overview',
    color: 'from-green-500 to-green-600',
    description: 'View main dashboard with statistics and overview'
  },
  {
    path: '/inspections/create',
    icon: 'fas fa-clipboard-list',
    title: 'Register Inspection',
    subtitle: 'Create and register new inspections',
    color: 'from-purple-500 to-purple-600',
    description: 'Create and register new inspections'
  },
  {
    path: '/inspections',
    icon: 'fas fa-eye',
    title: 'View Inspections',
    subtitle: 'Browse and view existing inspections',
    color: 'from-indigo-500 to-indigo-600',
    description: 'Browse and view existing inspections'
  },
  {
    path: '/reports',
    icon: 'fas fa-chart-bar',
    title: 'Reports',
    subtitle: 'Generate and view detailed reports',
    color: 'from-orange-500 to-orange-600',
    description: 'Generate and view detailed reports'
  },
  {
    path: '/admin',
    icon: 'fas fa-cog',
    title: 'Admin Settings',
    subtitle: 'Manage system settings and configurations',
    color: 'from-red-500 to-red-600',
    description: 'Manage system settings and configurations'
  }
];
