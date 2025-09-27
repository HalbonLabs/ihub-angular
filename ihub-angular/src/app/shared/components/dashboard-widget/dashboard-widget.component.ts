import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ChartComponent, ChartData } from '../chart/chart.component';

export interface WidgetConfig {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'list' | 'grid' | 'custom';
  size: 'small' | 'medium' | 'large' | 'xl';
  data?: any;
  chartData?: ChartData;
  chartType?: 'line' | 'bar' | 'doughnut' | 'pie';
  refreshable?: boolean;
  removable?: boolean;
  configurable?: boolean;
}

@Component({
  selector: 'app-dashboard-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    ChartComponent
  ],
  template: `
    <mat-card class="widget-card" [ngClass]="'widget-' + config.size">
      <mat-card-header class="widget-header">
        <mat-card-title>{{ config.title }}</mat-card-title>
        <div class="widget-actions">
          <button mat-icon-button [matMenuTriggerFor]="widgetMenu" *ngIf="hasActions()">
            <mat-icon>more_vert</mat-icon>
          </button>
        </div>
      </mat-card-header>

      <mat-card-content class="widget-content">
        <!-- Metric Widget -->
        <div *ngIf="config.type === 'metric'" class="metric-widget">
          <div class="metric-value">{{ config.data?.value || 0 }}</div>
          <div class="metric-label">{{ config.data?.label || 'Metric' }}</div>
          <div class="metric-change" [ngClass]="config.data?.changeType">
            <i [class]="getTrendIcon(config.data?.changeType)"></i>
            {{ config.data?.change || '0%' }}
          </div>
        </div>

        <!-- Chart Widget -->
        <div *ngIf="config.type === 'chart'" class="chart-widget">
          <app-chart
            [type]="config.chartType || 'line'"
            [data]="config.chartData!"
            *ngIf="config.chartData">
          </app-chart>
        </div>

        <!-- List Widget -->
        <div *ngIf="config.type === 'list'" class="list-widget">
          <div class="list-item" *ngFor="let item of config.data?.items">
            <div class="item-icon" [ngStyle]="{'background-color': item.color}">
              <i [class]="item.icon"></i>
            </div>
            <div class="item-content">
              <div class="item-title">{{ item.title }}</div>
              <div class="item-subtitle">{{ item.subtitle }}</div>
            </div>
            <div class="item-value">{{ item.value }}</div>
          </div>
        </div>

        <!-- Grid Widget -->
        <div *ngIf="config.type === 'grid'" class="grid-widget">
          <div class="grid-item" *ngFor="let item of config.data?.items" [ngClass]="item.class">
            <i [class]="item.icon"></i>
            <span class="grid-value">{{ item.value }}</span>
            <span class="grid-label">{{ item.label }}</span>
          </div>
        </div>

        <!-- Custom Widget Content -->
        <ng-content *ngIf="config.type === 'custom'"></ng-content>
      </mat-card-content>

      <!-- Widget Menu -->
      <mat-menu #widgetMenu="matMenu">
        <button mat-menu-item (click)="onRefresh()" *ngIf="config.refreshable">
          <mat-icon>refresh</mat-icon>
          <span>Refresh</span>
        </button>
        <button mat-menu-item (click)="onConfigure()" *ngIf="config.configurable">
          <mat-icon>settings</mat-icon>
          <span>Configure</span>
        </button>
        <button mat-menu-item (click)="onRemove()" *ngIf="config.removable">
          <mat-icon>delete</mat-icon>
          <span>Remove</span>
        </button>
      </mat-menu>
    </mat-card>
  `,
  styles: [`
    .widget-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      }

      &.widget-small {
        min-height: 150px;
      }

      &.widget-medium {
        min-height: 250px;
      }

      &.widget-large {
        min-height: 350px;
      }

      &.widget-xl {
        min-height: 450px;
      }
    }

    .widget-header {
      padding: 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);

      ::ng-deep .mat-mdc-card-header-text {
        flex: 1;
      }

      .widget-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    .widget-content {
      flex: 1;
      padding: 16px;
      display: flex;
      flex-direction: column;
    }

    .metric-widget {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      text-align: center;

      .metric-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 8px;
      }

      .metric-label {
        font-size: 1rem;
        color: #6b7280;
        margin-bottom: 12px;
      }

      .metric-change {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.9rem;
        font-weight: 600;

        &.increase {
          color: #059669;
        }

        &.decrease {
          color: #dc2626;
        }

        &.neutral {
          color: #6b7280;
        }
      }
    }

    .chart-widget {
      flex: 1;
      position: relative;
    }

    .list-widget {
      flex: 1;
      overflow-y: auto;

      .list-item {
        display: flex;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);

        &:last-child {
          border-bottom: none;
        }

        .item-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-right: 12px;
          font-size: 1rem;
        }

        .item-content {
          flex: 1;

          .item-title {
            font-weight: 600;
            color: #1f2937;
            font-size: 0.9rem;
          }

          .item-subtitle {
            color: #6b7280;
            font-size: 0.8rem;
            margin-top: 2px;
          }
        }

        .item-value {
          font-weight: 600;
          color: #1f2937;
        }
      }
    }

    .grid-widget {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 16px;
      flex: 1;
      align-content: start;

      .grid-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 16px;
        border-radius: 12px;
        background: rgba(0, 0, 0, 0.02);

        i {
          font-size: 1.5rem;
          margin-bottom: 8px;
          color: #3b82f6;
        }

        .grid-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          display: block;
        }

        .grid-label {
          font-size: 0.8rem;
          color: #6b7280;
          margin-top: 4px;
          display: block;
        }
      }
    }
  `]
})
export class DashboardWidgetComponent implements OnInit {
  @Input() config!: WidgetConfig;
  @Output() refresh = new EventEmitter<string>();
  @Output() configure = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();

  ngOnInit(): void {
    // Component initialization
  }

  hasActions(): boolean {
    return !!(this.config.refreshable || this.config.configurable || this.config.removable);
  }

  getTrendIcon(changeType: string): string {
    switch (changeType) {
      case 'increase': return 'fas fa-arrow-up';
      case 'decrease': return 'fas fa-arrow-down';
      default: return 'fas fa-minus';
    }
  }

  onRefresh(): void {
    this.refresh.emit(this.config.id);
  }

  onConfigure(): void {
    this.configure.emit(this.config.id);
  }

  onRemove(): void {
    this.remove.emit(this.config.id);
  }
}
