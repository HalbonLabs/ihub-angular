import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { Router } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiService } from '../../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';

interface StatCard {
  title: string;
  value: number | string;
  icon: string;
  change: number;
  changeLabel: string;
  color: string;
  route?: string;
}

interface RecentActivity {
  id: string;
  type: 'inspection' | 'user' | 'defect' | 'report';
  title: string;
  description: string;
  timestamp: Date;
  user: string;
  icon: string;
  color: string;
}

interface PendingInspection {
  id: string;
  propertyAddress: string;
  scheduledDate: Date;
  inspector: string;
  status: 'scheduled' | 'in-progress' | 'overdue';
  type: string;
  priority: 'low' | 'medium' | 'high';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatBadgeModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // User information
  currentUser$ = this.authService.currentUser$;
  greeting = this.getGreeting();
  
  // Loading states
  loading = true;
  statsLoading = true;
  activitiesLoading = true;
  inspectionsLoading = true;
  
  // Dashboard data
  stats: StatCard[] = [];
  recentActivities: RecentActivity[] = [];
  pendingInspections: PendingInspection[] = [];
  
  // Chart data (placeholder for now)
  monthlyInspections: any = null;
  defectsByCategory: any = null;
  
  // Table columns for pending inspections
  displayedColumns = ['property', 'scheduledDate', 'inspector', 'type', 'priority', 'status', 'actions'];
  
  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadDashboardData();
    
    // Refresh data every 5 minutes
    interval(300000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadDashboardData(false);
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private loadDashboardData(showLoading = true): void {
    if (showLoading) {
      this.loading = true;
    }
    
    // Load stats
    this.loadStats();
    
    // Load recent activities
    this.loadRecentActivities();
    
    // Load pending inspections
    this.loadPendingInspections();
    
    // Simulate chart data loading
    setTimeout(() => {
      this.monthlyInspections = this.generateMonthlyInspectionsData();
      this.defectsByCategory = this.generateDefectsByCategoryData();
      this.loading = false;
    }, 1500);
  }
  
  private loadStats(): void {
    this.statsLoading = true;
    
    // Simulated API call - replace with actual API call
    setTimeout(() => {
      this.stats = [
        {
          title: 'Total Inspections',
          value: 1248,
          icon: 'assignment',
          change: 12.5,
          changeLabel: 'vs last month',
          color: 'primary',
          route: '/inspections'
        },
        {
          title: 'Active Inspectors',
          value: 24,
          icon: 'people',
          change: 8.3,
          changeLabel: 'vs last month',
          color: 'accent',
          route: '/users'
        },
        {
          title: 'Pending Reviews',
          value: 36,
          icon: 'pending_actions',
          change: -5.2,
          changeLabel: 'vs last week',
          color: 'warn',
          route: '/inspections?status=pending'
        },
        {
          title: 'Reports Generated',
          value: 892,
          icon: 'description',
          change: 15.7,
          changeLabel: 'vs last month',
          color: 'success',
          route: '/reports'
        }
      ];
      this.statsLoading = false;
    }, 800);
    
    // Actual API call would be:
    // this.apiService.get<any>(API_ENDPOINTS.DASHBOARD.STATS)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (data) => {
    //       this.stats = data.stats;
    //       this.statsLoading = false;
    //     },
    //     error: () => this.statsLoading = false
    //   });
  }
  
  private loadRecentActivities(): void {
    this.activitiesLoading = true;
    
    // Simulated API call
    setTimeout(() => {
      this.recentActivities = [
        {
          id: '1',
          type: 'inspection',
          title: 'Inspection Completed',
          description: '123 Main St, Springfield',
          timestamp: new Date(Date.now() - 3600000),
          user: 'John Doe',
          icon: 'check_circle',
          color: 'success'
        },
        {
          id: '2',
          type: 'defect',
          title: 'Critical Defect Found',
          description: 'Roof leak at 456 Oak Ave',
          timestamp: new Date(Date.now() - 7200000),
          user: 'Jane Smith',
          icon: 'warning',
          color: 'warn'
        },
        {
          id: '3',
          type: 'report',
          title: 'Report Generated',
          description: 'Monthly summary report',
          timestamp: new Date(Date.now() - 10800000),
          user: 'System',
          icon: 'description',
          color: 'primary'
        },
        {
          id: '4',
          type: 'user',
          title: 'New Inspector Added',
          description: 'Mike Johnson joined the team',
          timestamp: new Date(Date.now() - 14400000),
          user: 'Admin',
          icon: 'person_add',
          color: 'accent'
        },
        {
          id: '5',
          type: 'inspection',
          title: 'Inspection Scheduled',
          description: '789 Pine St for tomorrow',
          timestamp: new Date(Date.now() - 18000000),
          user: 'Sarah Williams',
          icon: 'schedule',
          color: 'primary'
        }
      ];
      this.activitiesLoading = false;
    }, 1000);
  }
  
  private loadPendingInspections(): void {
    this.inspectionsLoading = true;
    
    // Simulated API call
    setTimeout(() => {
      this.pendingInspections = [
        {
          id: '1',
          propertyAddress: '123 Main Street, Springfield',
          scheduledDate: new Date(Date.now() + 86400000),
          inspector: 'John Doe',
          status: 'scheduled',
          type: 'Annual',
          priority: 'high'
        },
        {
          id: '2',
          propertyAddress: '456 Oak Avenue, Riverside',
          scheduledDate: new Date(Date.now() + 172800000),
          inspector: 'Jane Smith',
          status: 'scheduled',
          type: 'Pre-Purchase',
          priority: 'medium'
        },
        {
          id: '3',
          propertyAddress: '789 Pine Road, Lakeside',
          scheduledDate: new Date(Date.now() - 86400000),
          inspector: 'Mike Johnson',
          status: 'overdue',
          type: 'Maintenance',
          priority: 'high'
        },
        {
          id: '4',
          propertyAddress: '321 Elm Street, Downtown',
          scheduledDate: new Date(),
          inspector: 'Sarah Williams',
          status: 'in-progress',
          type: 'Safety',
          priority: 'high'
        },
        {
          id: '5',
          propertyAddress: '654 Maple Drive, Uptown',
          scheduledDate: new Date(Date.now() + 259200000),
          inspector: 'Tom Brown',
          status: 'scheduled',
          type: 'Routine',
          priority: 'low'
        }
      ];
      this.inspectionsLoading = false;
    }, 1200);
  }
  
  private generateMonthlyInspectionsData(): any {
    // Placeholder for chart data
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Inspections',
        data: [65, 78, 90, 81, 95, 120],
        backgroundColor: '#2196f3'
      }]
    };
  }
  
  private generateDefectsByCategoryData(): any {
    // Placeholder for chart data
    return {
      labels: ['Structural', 'Electrical', 'Plumbing', 'HVAC', 'Roofing', 'Other'],
      datasets: [{
        data: [30, 25, 20, 15, 8, 2],
        backgroundColor: [
          '#f44336',
          '#ff9800',
          '#ffc107',
          '#4caf50',
          '#2196f3',
          '#9c27b0'
        ]
      }]
    };
  }
  
  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }
  
  navigateToStat(route?: string): void {
    if (route) {
      this.router.navigate([route]);
    }
  }
  
  viewInspection(inspection: PendingInspection): void {
    this.router.navigate(['/inspections', inspection.id]);
  }
  
  editInspection(inspection: PendingInspection): void {
    this.router.navigate(['/inspections', inspection.id, 'edit']);
  }
  
  getStatusColor(status: string): string {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'in-progress': return 'accent';
      case 'overdue': return 'warn';
      default: return '';
    }
  }
  
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'warn';
      case 'medium': return 'accent';
      case 'low': return 'primary';
      default: return '';
    }
  }
  
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  }
  
  refreshDashboard(): void {
    this.loadDashboardData();
  }
}
