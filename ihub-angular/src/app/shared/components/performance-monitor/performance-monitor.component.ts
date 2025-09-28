import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
// Temporarily disabled Material imports for build compatibility
// import { MatCardModule } from '@angular/material/card';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatChipsModule } from '@angular/material/chips';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold: {
    warning: number;
    critical: number;
  };
  history: number[];
}

@Component({
  selector: 'app-performance-monitor',
  standalone: true,
  imports: [
    CommonModule
    // Temporarily disabled Material modules for build compatibility
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="performance-container">
      <div class="performance-header">
        <div class="header-content">
          <h2>System Performance Monitor</h2>
          <p>Real-time system health and performance metrics (Material UI temporarily disabled)</p>
        </div>
        <div class="header-controls">
          <button (click)="refreshMetrics()">Refresh</button>
        </div>
      </div>

      <div class="metrics-grid">
        <div *ngFor="let metric of systemMetrics; trackBy: trackByMetric"
             class="metric-card"
             [ngClass]="'status-' + metric.status">
          <div class="card-header">
            <h3>{{ metric.name }}</h3>
            <div class="metric-status">
              <div class="status-indicator" [ngClass]="'status-' + metric.status"></div>
            </div>
          </div>

          <div class="card-content">
            <div class="metric-display">
              <div class="metric-value">
                {{ metric.value }}
                <span class="metric-unit">{{ metric.unit }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Summary -->
      <div class="summary-card">
        <div class="card-header">
          <h3>Performance Summary</h3>
        </div>
        <div class="card-content">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-content">
                <div class="summary-value">{{ getHealthyCount() }}</div>
                <div class="summary-label">Healthy Metrics</div>
              </div>
            </div>

            <div class="summary-item">
              <div class="summary-content">
                <div class="summary-value">{{ getWarningCount() }}</div>
                <div class="summary-label">Warning Metrics</div>
              </div>
            </div>

            <div class="summary-item">
              <div class="summary-content">
                <div class="summary-value">{{ getCriticalCount() }}</div>
                <div class="summary-label">Critical Metrics</div>
              </div>
            </div>

            <div class="summary-item">
              <div class="summary-content">
                <div class="summary-value">{{ calculateUptime() }}%</div>
                <div class="summary-label">System Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .performance-container {
      padding: 1.5rem;
    }

    .performance-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;

      .header-content {
        h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        p {
          color: #6b7280;
          margin: 0;
        }
      }

      .header-controls {
        display: flex;
        align-items: center;
        gap: 1rem;

        ::ng-deep mat-chip-listbox {
          .mat-mdc-chip-option {
            border-radius: 20px;

            &.mdc-chip--selected {
              background-color: #3b82f6;
              color: white;
            }
          }
        }
      }
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .metric-card {
      border-radius: 16px;
      border: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      }

      &.status-warning {
        border-left: 4px solid #f59e0b;
      }

      &.status-critical {
        border-left: 4px solid #ef4444;
        animation: critical-pulse 2s infinite;
      }

      &.status-healthy {
        border-left: 4px solid #10b981;
      }

      ::ng-deep .mat-mdc-card-header {
        .mat-mdc-card-title {
          font-weight: 600;
          color: #1f2937;
        }

        .metric-status {
          .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            position: relative;

            &.status-healthy {
              background-color: #10b981;
            }

            &.status-warning {
              background-color: #f59e0b;
            }

            &.status-critical {
              background-color: #ef4444;
            }

            .pulse {
              position: absolute;
              inset: -4px;
              border-radius: 50%;
              background-color: inherit;
              opacity: 0.4;
              animation: pulse-ring 1.5s infinite;
            }
          }
        }
      }
    }

    .metric-display {
      .metric-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 1rem;
        display: flex;
        align-items: baseline;
        gap: 0.5rem;

        .metric-unit {
          font-size: 1rem;
          color: #6b7280;
          font-weight: 400;
        }
      }

      .metric-thresholds {
        margin-bottom: 1rem;

        .threshold {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;

          &.warning {
            color: #d97706;
          }

          &.critical {
            color: #dc2626;
          }

          .threshold-label {
            font-weight: 500;
          }
        }
      }

      .metric-chart {
        .mini-chart {
          display: flex;
          align-items: end;
          height: 60px;
          gap: 2px;

          .chart-bar {
            flex: 1;
            min-height: 4px;
            border-radius: 2px;
            transition: all 0.3s ease;

            &.bar-healthy {
              background-color: #10b981;
            }

            &.bar-warning {
              background-color: #f59e0b;
            }

            &.bar-critical {
              background-color: #ef4444;
            }
          }
        }
      }
    }

    .alerts-card {
      margin-bottom: 2rem;
      border-radius: 16px;
      border: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

      .alerts-list {
        .alert-item {
          display: flex;
          align-items: flex-start;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);

          &:last-child {
            border-bottom: none;
          }

          .alert-icon {
            margin-right: 1rem;

            ::ng-deep mat-icon {
              font-size: 1.25rem;
            }
          }

          .alert-content {
            flex: 1;

            .alert-title {
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 0.25rem;
            }

            .alert-message {
              color: #6b7280;
              font-size: 0.875rem;
              margin-bottom: 0.5rem;
            }

            .alert-timestamp {
              color: #9ca3af;
              font-size: 0.75rem;
            }
          }

          &.alert-warning {
            .alert-icon {
              color: #f59e0b;
            }
          }

          &.alert-critical {
            .alert-icon {
              color: #ef4444;
            }
          }
        }
      }
    }

    .summary-card {
      border-radius: 16px;
      border: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;

        .summary-item {
          display: flex;
          align-items: center;
          gap: 1rem;

          .summary-icon {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;

            &.healthy {
              background-color: #10b981;
            }

            &.warning {
              background-color: #f59e0b;
            }

            &.critical {
              background-color: #ef4444;
            }

            &.info {
              background-color: #3b82f6;
            }
          }

          .summary-content {
            .summary-value {
              font-size: 1.5rem;
              font-weight: 700;
              color: #1f2937;
            }

            .summary-label {
              color: #6b7280;
              font-size: 0.875rem;
            }
          }
        }
      }
    }

    @keyframes critical-pulse {
      0%, 100% {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      50% {
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      }
    }

    @keyframes pulse-ring {
      0% {
        transform: scale(0.8);
        opacity: 1;
      }
      100% {
        transform: scale(1.4);
        opacity: 0;
      }
    }

    @media (max-width: 768px) {
      .performance-container {
        padding: 1rem;
      }

      .performance-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class PerformanceMonitorComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  systemMetrics: SystemMetric[] = [];
  systemAlerts: any[] = [];

  ngOnInit(): void {
    this.initializeMetrics();
    this.startRealTimeUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeMetrics(): void {
    this.systemMetrics = [
      {
        name: 'CPU Usage',
        value: 45,
        unit: '%',
        status: 'healthy',
        threshold: { warning: 70, critical: 85 },
        history: [40, 42, 38, 45, 48, 44, 41, 45]
      },
      {
        name: 'Memory Usage',
        value: 68,
        unit: '%',
        status: 'warning',
        threshold: { warning: 65, critical: 80 },
        history: [60, 62, 65, 68, 66, 69, 67, 68]
      },
      {
        name: 'Disk I/O',
        value: 25,
        unit: 'MB/s',
        status: 'healthy',
        threshold: { warning: 50, critical: 80 },
        history: [20, 22, 28, 25, 23, 26, 24, 25]
      },
      {
        name: 'Network Latency',
        value: 12,
        unit: 'ms',
        status: 'healthy',
        threshold: { warning: 50, critical: 100 },
        history: [10, 11, 15, 12, 9, 13, 11, 12]
      },
      {
        name: 'Database Connections',
        value: 145,
        unit: '',
        status: 'healthy',
        threshold: { warning: 200, critical: 250 },
        history: [140, 142, 148, 145, 143, 147, 144, 145]
      },
      {
        name: 'Error Rate',
        value: 2.1,
        unit: '%',
        status: 'warning',
        threshold: { warning: 2, critical: 5 },
        history: [1.8, 1.9, 2.2, 2.1, 2.0, 2.3, 2.2, 2.1]
      }
    ];

    this.systemAlerts = [
      {
        id: '1',
        title: 'Memory Usage Warning',
        message: 'Memory usage has exceeded 65% threshold',
        severity: 'warning',
        timestamp: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        id: '2',
        title: 'Error Rate Increase',
        message: 'Application error rate has increased by 15%',
        severity: 'warning',
        timestamp: new Date(Date.now() - 15 * 60 * 1000)
      }
    ];
  }

  private startRealTimeUpdates(): void {
    interval(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateMetrics();
      });
  }

  private updateMetrics(): void {
    this.systemMetrics.forEach(metric => {
      // Simulate real-time data updates
      const variance = (Math.random() - 0.5) * 10;
      const newValue = Math.max(0, metric.value + variance);

      metric.value = Math.round(newValue * 10) / 10;

      // Update status based on thresholds
      if (metric.value >= metric.threshold.critical) {
        metric.status = 'critical';
      } else if (metric.value >= metric.threshold.warning) {
        metric.status = 'warning';
      } else {
        metric.status = 'healthy';
      }

      // Update history
      metric.history.push(metric.value);
      if (metric.history.length > 20) {
        metric.history.shift();
      }
    });
  }

  getBarHeight(point: number, metric: SystemMetric): number {
    const max = Math.max(...metric.history, metric.threshold.critical);
    return (point / max) * 100;
  }

  getBarStatus(point: number, metric: SystemMetric): string {
    if (point >= metric.threshold.critical) return 'bar-critical';
    if (point >= metric.threshold.warning) return 'bar-warning';
    return 'bar-healthy';
  }

  getAlertIcon(severity: string): string {
    switch (severity) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  }

  getHealthyCount(): number {
    return this.systemMetrics.filter(m => m.status === 'healthy').length;
  }

  getWarningCount(): number {
    return this.systemMetrics.filter(m => m.status === 'warning').length;
  }

  getCriticalCount(): number {
    return this.systemMetrics.filter(m => m.status === 'critical').length;
  }

  calculateUptime(): number {
    return 99.7; // Simulated uptime
  }

  refreshMetrics(): void {
    this.updateMetrics();
  }

  dismissAlert(alertId: string): void {
    this.systemAlerts = this.systemAlerts.filter(alert => alert.id !== alertId);
  }

  trackByMetric(index: number, metric: SystemMetric): string {
    return metric.name;
  }

  trackByAlert(index: number, alert: any): string {
    return alert.id;
  }
}
