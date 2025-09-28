import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger, state } from '@angular/animations';
import { Subject, interval, BehaviorSubject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

interface DashboardMetric {
  label: string;
  value: string | number;
  displayValue?: string | number;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
  description: string;
  target?: number;
  trend?: number[];
}

interface ThemeConfig {
  isDarkMode: boolean;
  primaryColor: string;
  accentColor: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  badge?: number;
  hoverState?: 'default' | 'hovered';
  stats?: Array<{ icon: string; value: string | number; }>;
  category?: string;
}

interface RecentActivity {
  title: string;
  time: string;
  icon: string;
  type: 'success' | 'warning' | 'info' | 'error';
  description: string;
  timestamp: Date;
  read: boolean;
}

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  animations: [
    trigger('fadeInUp', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(50px)' }),
          stagger(100, [
            animate('600ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('500ms ease-in-out', style({ transform: 'translateX(0%)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ]),
    trigger('bounceIn', [
      transition(':enter', [
        style({ transform: 'scale(0.3)', opacity: 0 }),
        animate('600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ]),
    trigger('cardHover', [
      state('default', style({ transform: 'scale(1) translateY(0)' })),
      state('hovered', style({ transform: 'scale(1.03) translateY(-8px)' })),
      transition('default <=> hovered', animate('300ms cubic-bezier(0.35, 0, 0.25, 1)'))
    ])
  ],
  template: `
    <div class="dashboard-container" [class.dark-theme]="themeConfig.isDarkMode">
      <!-- Header Section -->
      <div class="dashboard-header">
        <div class="header-content">
          <div class="title-section">
            <h1>
              <i class="fas fa-chart-line header-icon"></i>
              InspectHub
              <span class="version-badge">v2.0</span>
            </h1>
            <p>Advanced inspection management platform</p>
          </div>
          <div class="header-controls">
            <button type="button" class="theme-toggle" (click)="toggleTheme()">
              <i class="fas fa-moon" *ngIf="!themeConfig.isDarkMode"></i>
              <i class="fas fa-sun" *ngIf="themeConfig.isDarkMode"></i>
            </button>
            <button type="button" class="notification-btn">
              <i class="fas fa-bell"></i>
              <span class="badge" *ngIf="unreadNotifications">{{unreadNotifications}}</span>
            </button>
          </div>
        </div>

        <div class="header-stats">
          <div class="stat-item" *ngFor="let stat of headerStats; trackBy: trackByStat">
            <div class="stat-icon">
              <i [class]="stat.icon"></i>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stat.displayValue || 0 }}</span>
              <span class="stat-label">{{ stat.label }}</span>
              <div class="stat-trend" [ngClass]="stat.changeType">
                <i [class]="getTrendIcon(stat.changeType)"></i>
                {{ stat.change }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions Grid -->
      <div class="actions-section">
        <div class="section-header">
          <h2><i class="fas fa-rocket"></i> Quick Actions</h2>
          <div class="section-controls">
            <select [(ngModel)]="selectedCategory" class="filter-select">
              <option value="all">All Categories</option>
              <option value="inspection">Inspections</option>
              <option value="reports">Reports</option>
              <option value="admin">Administration</option>
            </select>
          </div>
        </div>

        <div class="actions-grid">
          <div
            *ngFor="let action of filteredActions; let i = index; trackBy: trackByAction"
            class="action-card glassmorphism"
            [ngClass]="'action-' + action.color"
            (click)="navigateToAction(action.route)"
            [title]="action.description">

            <div class="action-header">
              <div class="action-icon-wrapper" [ngClass]="'icon-wrapper-' + action.color">
                <i [class]="action.icon"></i>
              </div>
              <div class="action-badge" *ngIf="action.badge">
                {{ action.badge }}
              </div>
            </div>

            <div class="action-content">
              <h3>{{ action.title }}</h3>
              <p>{{ action.description }}</p>

              <div class="action-footer" *ngIf="action.stats">
                <div class="mini-stats">
                  <span class="mini-stat" *ngFor="let stat of action.stats">
                    <i [class]="stat.icon"></i>
                    {{ stat.value }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Metrics Dashboard -->
      <div class="metrics-section">
        <div class="metrics-header">
          <h2><i class="fas fa-analytics"></i> Performance Analytics</h2>
          <div class="metrics-controls">
            <div class="tabs">
              <button
                type="button"
                class="tab-btn"
                [class.active]="selectedMetricTab === 0"
                (click)="selectedMetricTab = 0">Overview</button>
              <button
                type="button"
                class="tab-btn"
                [class.active]="selectedMetricTab === 1"
                (click)="selectedMetricTab = 1">Trends</button>
              <button
                type="button"
                class="tab-btn"
                [class.active]="selectedMetricTab === 2"
                (click)="selectedMetricTab = 2">Forecasts</button>
            </div>
            <button type="button" class="export-btn" (click)="exportMetrics()">
              <i class="fas fa-download"></i> Export
            </button>
          </div>
        </div>

        <div class="metrics-grid">
          <div
            *ngFor="let metric of dashboardMetrics; let i = index; trackBy: trackByMetric"
            class="metric-card glassmorphism"
            [ngClass]="'metric-' + metric.color">

            <div class="metric-header">
              <div class="metric-icon-wrapper">
                <i [class]="metric.icon"></i>
              </div>
              <div class="metric-change" [ngClass]="metric.changeType">
                <i [class]="getTrendIcon(metric.changeType)"></i>
                {{ metric.change }}
              </div>
            </div>

            <div class="metric-body">
              <div class="metric-value">
                {{ metric.displayValue || 0 }}
              </div>
              <div class="metric-label">{{ metric.label }}</div>
              <div class="metric-description">{{ metric.description }}</div>
            </div>

            <div class="metric-footer">
              <div class="metric-progress">
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="getMetricProgress(metric)"></div>
                </div>
                <span class="progress-label">
                  {{ getMetricProgress(metric) }}% of target
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Section -->
      <div class="bottom-section">
        <!-- Activity Feed -->
        <div class="activity-card glassmorphism">
          <div class="card-header">
            <div>
              <h3>
                <i class="fas fa-activity"></i>
                Live Activity Feed
              </h3>
              <p class="card-subtitle">Real-time updates and notifications</p>
            </div>
            <div class="header-actions">
              <button type="button" class="refresh-btn" (click)="refreshActivity()" [title]="'Refresh'">
                <i class="fas fa-sync-alt" [class.rotating]="isRefreshing"></i>
              </button>
            </div>
          </div>
          <div class="card-content">
            <div class="activity-list" #activityList>
              <div
                *ngFor="let activity of recentActivities; let i = index; trackBy: trackByActivity"
                class="activity-item"
                [class.unread]="!activity.read">

                <div class="activity-icon" [ngClass]="'activity-' + activity.type">
                  <i [class]="activity.icon"></i>
                </div>

                <div class="activity-content">
                  <div class="activity-title">{{ activity.title }}</div>
                  <div class="activity-description">{{ activity.description }}</div>
                  <div class="activity-meta">
                    <span class="activity-time">
                      <i class="fas fa-clock"></i>
                      {{ formatActivityTime(activity.timestamp) }}
                    </span>
                    <span class="activity-type-badge" [ngClass]="activity.type">
                      {{ activity.type }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="activity-footer" *ngIf="recentActivities.length > 5">
              <button type="button" class="load-more-btn" (click)="loadMoreActivity()">
                <i class="fas fa-chevron-down"></i>
                Load More
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="quick-stats-card glassmorphism">
          <div class="card-header">
            <h3>
              <i class="fas fa-chart-pie"></i>
              System Overview
            </h3>
            <div class="header-actions">
              <label class="toggle-switch">
                <input type="checkbox" [(ngModel)]="realTimeMode">
                <span class="slider"></span>
                <i class="fas fa-broadcast-tower"></i>
              </label>
            </div>
          </div>
          <div class="card-content">
            <div class="enhanced-stats-grid">
              <div
                *ngFor="let stat of quickStats; trackBy: trackByQuickStat"
                class="enhanced-stat-item">

                <div class="stat-icon-wrapper" [ngClass]="stat.colorClass">
                  <i [class]="stat.icon"></i>
                </div>

                <div class="stat-content">
                  <div class="stat-header">
                    <span class="stat-name">{{ stat.name }}</span>
                    <span class="stat-trend" [ngClass]="stat.trend">
                      <i [class]="getTrendIcon(stat.trend)"></i>
                    </span>
                  </div>

                  <div class="stat-value" [ngClass]="stat.valueClass">
                    {{ stat.displayValue }}
                  </div>

                  <div class="stat-subtitle">{{ stat.subtitle }}</div>

                  <div class="stat-progress" *ngIf="stat.progress !== undefined">
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width.%]="stat.progress"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="stats-summary">
              <div class="summary-item">
                <span class="summary-label">System Health</span>
                <div class="health-indicator excellent">
                  <div class="health-dots">
                    <div class="dot active"></div>
                    <div class="dot active"></div>
                    <div class="dot active"></div>
                  </div>
                  <span>Excellent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./homepage.component.simple.scss']
})
export class HomepageComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('activityList', { static: false }) activityList?: ElementRef;

  // Reactive properties
  private destroy$ = new Subject<void>();
  themeConfig: ThemeConfig = {
    isDarkMode: false,
    primaryColor: '#1976d2',
    accentColor: '#ff4081'
  };

  // Component state
  selectedCategory = 'all';
  selectedMetricTab = 0;
  isRefreshing = false;
  realTimeMode = true;
  unreadNotifications = 3;

  // Data arrays
  headerStats: DashboardMetric[] = [];
  dashboardMetrics: DashboardMetric[] = [];
  quickStats: any[] = [];
  filteredActions: QuickAction[] = [];
  notifications: NotificationItem[] = [];

  quickActions: QuickAction[] = [
    {
      title: 'Analytics Dashboard',
      description: 'Advanced data insights & charts',
      icon: 'fas fa-chart-line',
      route: '/dashboard/analytics',
      color: 'blue',
      badge: 3,
      category: 'reports',
      stats: [
        { icon: 'fas fa-chart-bar', value: 12 },
        { icon: 'fas fa-eye', value: 847 }
      ]
    },
    {
      title: 'Performance Monitor',
      description: 'Real-time system metrics',
      icon: 'fas fa-tachometer-alt',
      route: '/dashboard/performance',
      color: 'green',
      category: 'admin',
      stats: [
        { icon: 'fas fa-server', value: '98%' },
        { icon: 'fas fa-bolt', value: '12ms' }
      ]
    },
    {
      title: 'Docs Review',
      description: 'Document reviews & approvals',
      icon: 'fas fa-file-alt',
      route: '/documents',
      color: 'orange',
      badge: 3
    },
    {
      title: 'Schedule',
      description: 'Inspection scheduling',
      icon: 'fas fa-calendar-alt',
      route: '/schedule',
      color: 'purple',
      badge: 1
    },
    {
      title: 'Register Inspection',
      description: 'Create new inspections',
      icon: 'fas fa-clipboard-check',
      route: '/inspections/register',
      color: 'indigo',
      badge: 1,
      category: 'inspection',
      stats: [
        { icon: 'fas fa-plus', value: 142 },
        { icon: 'fas fa-clock', value: '2.4h' }
      ]
    },
    {
      title: 'Defects',
      description: 'Track defect issues',
      icon: 'fas fa-exclamation-triangle',
      route: '/defects',
      color: 'red',
      badge: 1
    },
    {
      title: 'Follow-up',
      description: 'Resolution tracking',
      icon: 'fas fa-tasks',
      route: '/follow-up',
      color: 'teal',
      badge: 1
    },
    {
      title: 'Improvements',
      description: 'Process optimization',
      icon: 'fas fa-lightbulb',
      route: '/improvements',
      color: 'amber',
      badge: 1
    },
    {
      title: 'Enhanced Monitoring',
      description: 'Advanced installer oversight',
      icon: 'fas fa-search-plus',
      route: '/enhanced-monitoring',
      color: 'cyan'
    },
    {
      title: 'Installers',
      description: 'Installer management',
      icon: 'fas fa-users',
      route: '/installers',
      color: 'brown'
    },
    {
      title: 'Reports',
      description: 'Analytics & insights',
      icon: 'fas fa-chart-bar',
      route: '/reports',
      color: 'gray'
    },
    {
      title: 'Import/Export',
      description: 'Data management',
      icon: 'fas fa-download',
      route: '/import-export',
      color: 'blue'
    }
  ];

  recentActivities: RecentActivity[] = [
    {
      title: 'John Smith moved to escalated phase',
      description: 'Additional oversight required',
      time: '2 hours ago',
      icon: 'fas fa-exclamation-circle',
      type: 'warning',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false
    },
    {
      title: 'Sarah Johnson scheduled for quarterly review',
      description: 'Routine compliance check',
      time: '1 hour ago',
      icon: 'fas fa-calendar-check',
      type: 'info',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      read: false
    },
    {
      title: 'Michael Brown compliance issues resolved',
      description: 'All requirements met',
      time: '1 day ago',
      icon: 'fas fa-check-circle',
      type: 'success',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.initializeData();
    this.startRealTimeUpdates();
  }

  ngAfterViewInit(): void {
    // Initialize any view-specific functionality
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Data initialization
  private initializeData(): void {
    this.initializeHeaderStats();
    this.initializeDashboardMetrics();
    this.initializeQuickStats();
    this.filteredActions = [...this.quickActions];
  }

  private initializeHeaderStats(): void {
    this.headerStats = [
      {
        label: 'Total Inspections',
        value: 142,
        displayValue: 142,
        change: '+12%',
        changeType: 'increase',
        icon: 'fas fa-clipboard-check',
        color: 'blue',
        description: 'Total inspections completed this month'
      },
      {
        label: 'Active Monitoring',
        value: 28,
        displayValue: 28,
        change: '+8%',
        changeType: 'increase',
        icon: 'fas fa-eye',
        color: 'green',
        description: 'Currently active monitoring sessions'
      },
      {
        label: 'Pass Rate',
        value: 84,
        displayValue: '84%',
        change: '+3%',
        changeType: 'increase',
        icon: 'fas fa-check-circle',
        color: 'orange',
        description: 'Overall inspection pass rate'
      }
    ];
  }

  private initializeDashboardMetrics(): void {
    this.dashboardMetrics = [
      {
        label: 'Total Inspections',
        value: 142,
        displayValue: 142,
        change: '+12%',
        changeType: 'increase',
        icon: 'fas fa-clipboard-check',
        color: 'primary',
        description: 'All inspections completed',
        target: 180,
        trend: [65, 72, 78, 85, 92, 98, 105]
      },
      {
        label: 'Completed',
        value: 89,
        displayValue: 89,
        change: '+8%',
        changeType: 'increase',
        icon: 'fas fa-check-circle',
        color: 'accent',
        description: 'Successfully completed inspections',
        target: 120,
        trend: [45, 52, 58, 65, 72, 78, 89]
      },
      {
        label: 'In Progress',
        value: 23,
        displayValue: 23,
        change: '-3%',
        changeType: 'decrease',
        icon: 'fas fa-clock',
        color: 'warn',
        description: 'Currently ongoing inspections',
        target: 30,
        trend: [28, 32, 29, 26, 24, 25, 23]
      },
      {
        label: 'Pending',
        value: 30,
        displayValue: 30,
        change: '+5%',
        changeType: 'increase',
        icon: 'fas fa-hourglass-half',
        color: 'primary',
        description: 'Awaiting review or scheduling',
        target: 25,
        trend: [22, 25, 28, 26, 29, 27, 30]
      }
    ];
  }

  private initializeQuickStats(): void {
    this.quickStats = [
      {
        name: 'Compliance Rate',
        value: 84,
        displayValue: '84%',
        subtitle: 'Industry standard: 78%',
        icon: 'fas fa-shield-check',
        colorClass: 'success',
        valueClass: 'success',
        trend: 'increase',
        progress: 84,
        progressColor: 'primary'
      },
      {
        name: 'Avg. Resolution Time',
        value: 12.5,
        displayValue: '12.5 days',
        subtitle: 'Target: 10 days',
        icon: 'fas fa-stopwatch',
        colorClass: 'warning',
        valueClass: 'warning',
        trend: 'decrease',
        progress: 75,
        progressColor: 'accent'
      },
      {
        name: 'Monthly Growth',
        value: 8.2,
        displayValue: '+8.2%',
        subtitle: 'Compared to last month',
        icon: 'fas fa-chart-line',
        colorClass: 'success',
        valueClass: 'success',
        trend: 'increase',
        progress: 65,
        progressColor: 'primary'
      },
      {
        name: 'Pending Reviews',
        value: 3,
        displayValue: '3',
        subtitle: 'Requires attention',
        icon: 'fas fa-exclamation-triangle',
        colorClass: 'error',
        valueClass: 'error',
        trend: 'neutral',
        progress: 30,
        progressColor: 'warn'
      }
    ];
  }

  // Animation and interaction methods
  onCardHover(action: QuickAction, isHovered: boolean): void {
    action.hoverState = isHovered ? 'hovered' : 'default';
  }

  // Theme methods
  toggleTheme(): void {
    this.themeConfig.isDarkMode = !this.themeConfig.isDarkMode;
    document.body.classList.toggle('dark-theme', this.themeConfig.isDarkMode);
  }

  // Utility methods
  getTrendIcon(changeType: string): string {
    switch (changeType) {
      case 'increase': return 'fas fa-arrow-up';
      case 'decrease': return 'fas fa-arrow-down';
      default: return 'fas fa-minus';
    }
  }

  getMetricProgress(metric: DashboardMetric): number {
    if (!metric.target) return 0;
    return Math.round((Number(metric.value) / metric.target) * 100);
  }

  getProgressBarColor(changeType: string): string {
    switch (changeType) {
      case 'increase': return 'primary';
      case 'decrease': return 'warn';
      default: return 'accent';
    }
  }

  formatActivityTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  // Real-time updates
  private startRealTimeUpdates(): void {
    if (this.realTimeMode) {
      interval(30000) // Update every 30 seconds
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.updateMetrics();
        });
    }
  }

  private updateMetrics(): void {
    // Simulate real-time data updates
    this.headerStats.forEach(stat => {
      const variance = Math.random() * 0.02 - 0.01; // ±1% variance
      const newValue = Number(stat.value) * (1 + variance);
      stat.displayValue = Math.round(newValue);
    });
  }

  // Action methods
  refreshActivity(): void {
    this.isRefreshing = true;
    setTimeout(() => {
      this.isRefreshing = false;
      // Add new activity item
      this.recentActivities.unshift({
        title: 'System refresh completed',
        description: 'All data synchronized',
        time: 'Just now',
        icon: 'fas fa-sync',
        type: 'success',
        timestamp: new Date(),
        read: false
      });
    }, 1000);
  }

  loadMoreActivity(): void {
    // Simulate loading more activities
    console.log('Loading more activities...');
  }

  exportMetrics(): void {
    console.log('Exporting metrics...');
  }

  navigateToAction(route: string): void {
    this.router.navigate([route]);
  }

  // TrackBy functions for performance
  trackByAction(index: number, action: QuickAction): string {
    return action.title;
  }

  trackByMetric(index: number, metric: DashboardMetric): string {
    return metric.label;
  }

  trackByStat(index: number, stat: DashboardMetric): string {
    return stat.label;
  }

  trackByActivity(index: number, activity: RecentActivity): string {
    return activity.title + activity.timestamp;
  }

  trackByQuickStat(index: number, stat: any): string {
    return stat.name;
  }
}
