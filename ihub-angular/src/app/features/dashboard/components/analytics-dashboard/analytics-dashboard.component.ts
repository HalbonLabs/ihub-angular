import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { DashboardWidgetComponent, WidgetConfig } from '../../../../shared/components/dashboard-widget/dashboard-widget.component';
import { ChartData } from '../../../../shared/components/chart/chart.component';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    DashboardWidgetComponent
  ],
  template: `
    <div class="analytics-container">
      <div class="analytics-header">
        <div class="header-content">
          <h1>Analytics Dashboard</h1>
          <p>Advanced data insights and performance metrics</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary">
            <mat-icon>add</mat-icon>
            Add Widget
          </button>
          <button mat-stroked-button>
            <mat-icon>settings</mat-icon>
            Customize
          </button>
        </div>
      </div>

      <mat-tab-group class="analytics-tabs">
        <mat-tab label="Overview">
          <div class="widgets-grid overview-grid">
            <app-dashboard-widget
              *ngFor="let widget of overviewWidgets; trackBy: trackByWidget"
              [config]="widget"
              (refresh)="onWidgetRefresh($event)"
              (configure)="onWidgetConfigure($event)"
              (remove)="onWidgetRemove($event)"
              [ngClass]="'grid-item-' + widget.size">
            </app-dashboard-widget>
          </div>
        </mat-tab>

        <mat-tab label="Performance">
          <div class="widgets-grid performance-grid">
            <app-dashboard-widget
              *ngFor="let widget of performanceWidgets; trackBy: trackByWidget"
              [config]="widget"
              (refresh)="onWidgetRefresh($event)"
              (configure)="onWidgetConfigure($event)"
              (remove)="onWidgetRemove($event)"
              [ngClass]="'grid-item-' + widget.size">
            </app-dashboard-widget>
          </div>
        </mat-tab>

        <mat-tab label="Trends">
          <div class="widgets-grid trends-grid">
            <app-dashboard-widget
              *ngFor="let widget of trendsWidgets; trackBy: trackByWidget"
              [config]="widget"
              (refresh)="onWidgetRefresh($event)"
              (configure)="onWidgetConfigure($event)"
              (remove)="onWidgetRemove($event)"
              [ngClass]="'grid-item-' + widget.size">
            </app-dashboard-widget>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .analytics-container {
      padding: 2rem;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      min-height: calc(100vh - 64px);
    }

    .analytics-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;

      .header-content {
        h1 {
          font-size: 2.25rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
          background: linear-gradient(135deg, #1f2937 0%, #4b5563 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        p {
          color: #6b7280;
          font-size: 1.1rem;
          margin: 0;
        }
      }

      .header-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
      }
    }

    .analytics-tabs {
      ::ng-deep .mat-mdc-tab-group {
        .mat-mdc-tab-header {
          .mat-mdc-tab-label-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            padding: 0.25rem;
            margin-bottom: 1rem;
          }

          .mat-mdc-tab {
            min-width: 120px;
            border-radius: 8px;
            font-weight: 600;

            &.mdc-tab--active {
              background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
              color: white;
              box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
            }
          }
        }
      }
    }

    .widgets-grid {
      display: grid;
      gap: 1.5rem;

      &.overview-grid {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        grid-template-areas:
          "metric1 metric2 chart1"
          "metric3 metric4 chart1"
          "chart2 chart2 list1";
      }

      &.performance-grid {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      }

      &.trends-grid {
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
      }

      .grid-item-small {
        grid-column: span 1;
      }

      .grid-item-medium {
        grid-column: span 1;
      }

      .grid-item-large {
        grid-column: span 2;
      }

      .grid-item-xl {
        grid-column: span 3;
      }
    }

    @media (max-width: 1200px) {
      .widgets-grid {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));

        &.overview-grid {
          grid-template-areas: none;
        }

        .grid-item-large,
        .grid-item-xl {
          grid-column: span 1;
        }
      }
    }

    @media (max-width: 768px) {
      .analytics-container {
        padding: 1rem;
      }

      .analytics-header {
        flex-direction: column;
        align-items: flex-start;

        .header-content h1 {
          font-size: 1.875rem;
        }
      }

      .widgets-grid {
        grid-template-columns: 1fr;

        .grid-item-small,
        .grid-item-medium,
        .grid-item-large,
        .grid-item-xl {
          grid-column: span 1;
        }
      }
    }
  `]
})
export class AnalyticsDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  overviewWidgets: WidgetConfig[] = [];
  performanceWidgets: WidgetConfig[] = [];
  trendsWidgets: WidgetConfig[] = [];

  ngOnInit(): void {
    this.initializeWidgets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeWidgets(): void {
    this.overviewWidgets = [
      {
        id: 'total-inspections',
        title: 'Total Inspections',
        type: 'metric',
        size: 'small',
        data: {
          value: '1,247',
          label: 'This Month',
          change: '+12%',
          changeType: 'increase'
        },
        refreshable: true
      },
      {
        id: 'completion-rate',
        title: 'Completion Rate',
        type: 'metric',
        size: 'small',
        data: {
          value: '94.7%',
          label: 'Success Rate',
          change: '+5.2%',
          changeType: 'increase'
        },
        refreshable: true
      },
      {
        id: 'monthly-trend',
        title: 'Monthly Inspection Trend',
        type: 'chart',
        size: 'large',
        chartType: 'line',
        chartData: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Inspections',
            data: [850, 920, 1100, 980, 1200, 1247],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        refreshable: true,
        configurable: true
      },
      {
        id: 'avg-duration',
        title: 'Avg Duration',
        type: 'metric',
        size: 'small',
        data: {
          value: '2.4h',
          label: 'Per Inspection',
          change: '-8min',
          changeType: 'increase'
        },
        refreshable: true
      },
      {
        id: 'pending-reviews',
        title: 'Pending Reviews',
        type: 'metric',
        size: 'small',
        data: {
          value: '23',
          label: 'Awaiting Action',
          change: '-5',
          changeType: 'increase'
        },
        refreshable: true
      },
      {
        id: 'inspection-types',
        title: 'Inspection Distribution',
        type: 'chart',
        size: 'large',
        chartType: 'doughnut',
        chartData: {
          labels: ['Safety', 'Quality', 'Compliance', 'Maintenance', 'Other'],
          datasets: [{
            label: 'Inspections',
            data: [35, 25, 20, 15, 5],
            backgroundColor: [
              '#3b82f6',
              '#10b981',
              '#f59e0b',
              '#ef4444',
              '#8b5cf6'
            ]
          }]
        },
        refreshable: true,
        configurable: true
      },
      {
        id: 'recent-activity',
        title: 'Recent Activity',
        type: 'list',
        size: 'medium',
        data: {
          items: [
            {
              title: 'Safety Inspection Completed',
              subtitle: 'Building A - Floor 3',
              value: '2m ago',
              icon: 'fas fa-shield-check',
              color: '#10b981'
            },
            {
              title: 'Quality Review Pending',
              subtitle: 'Manufacturing Unit B',
              value: '15m ago',
              icon: 'fas fa-clock',
              color: '#f59e0b'
            },
            {
              title: 'Compliance Check Failed',
              subtitle: 'Warehouse C',
              value: '1h ago',
              icon: 'fas fa-exclamation-triangle',
              color: '#ef4444'
            },
            {
              title: 'Maintenance Scheduled',
              subtitle: 'Equipment Room D',
              value: '2h ago',
              icon: 'fas fa-tools',
              color: '#3b82f6'
            }
          ]
        },
        refreshable: true
      }
    ];

    this.performanceWidgets = [
      {
        id: 'performance-overview',
        title: 'Performance Overview',
        type: 'grid',
        size: 'large',
        data: {
          items: [
            {
              icon: 'fas fa-tachometer-alt',
              value: '98.5%',
              label: 'Uptime',
              class: 'success'
            },
            {
              icon: 'fas fa-users',
              value: '34',
              label: 'Active Users',
              class: 'info'
            },
            {
              icon: 'fas fa-chart-line',
              value: '+15%',
              label: 'Growth',
              class: 'success'
            },
            {
              icon: 'fas fa-server',
              value: '12ms',
              label: 'Response Time',
              class: 'success'
            }
          ]
        },
        refreshable: true
      },
      {
        id: 'response-times',
        title: 'Response Time Trends',
        type: 'chart',
        size: 'large',
        chartType: 'bar',
        chartData: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Average Response Time (ms)',
            data: [12, 19, 3, 5, 2, 3, 10],
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: '#3b82f6',
            borderWidth: 1
          }]
        },
        refreshable: true,
        configurable: true
      }
    ];

    this.trendsWidgets = [
      {
        id: 'yearly-comparison',
        title: 'Year-over-Year Comparison',
        type: 'chart',
        size: 'xl',
        chartType: 'line',
        chartData: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [
            {
              label: '2023',
              data: [2500, 3200, 2800, 3500],
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: false
            },
            {
              label: '2024',
              data: [2800, 3600, 3200, 4100],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: false
            }
          ]
        },
        refreshable: true,
        configurable: true
      },
      {
        id: 'department-breakdown',
        title: 'Department Performance',
        type: 'chart',
        size: 'xl',
        chartType: 'bar',
        chartData: {
          labels: ['Engineering', 'Manufacturing', 'Quality', 'Safety', 'Maintenance'],
          datasets: [
            {
              label: 'Completed',
              data: [85, 92, 78, 96, 88],
              backgroundColor: 'rgba(16, 185, 129, 0.8)'
            },
            {
              label: 'Pending',
              data: [15, 8, 22, 4, 12],
              backgroundColor: 'rgba(245, 158, 11, 0.8)'
            }
          ]
        },
        refreshable: true,
        configurable: true
      }
    ];
  }

  trackByWidget(index: number, widget: WidgetConfig): string {
    return widget.id;
  }

  onWidgetRefresh(widgetId: string): void {
    console.log('Refreshing widget:', widgetId);
    // Implement widget refresh logic
  }

  onWidgetConfigure(widgetId: string): void {
    console.log('Configuring widget:', widgetId);
    // Implement widget configuration logic
  }

  onWidgetRemove(widgetId: string): void {
    console.log('Removing widget:', widgetId);
    // Implement widget removal logic
  }
}
