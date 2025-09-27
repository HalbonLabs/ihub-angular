import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HomepageComponent } from './components/homepage/homepage.component';
import { AnalyticsDashboardComponent } from './components/analytics-dashboard/analytics-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: HomepageComponent
  },
  {
    path: 'detailed',
    component: DashboardComponent
  },
  {
    path: 'analytics',
    component: AnalyticsDashboardComponent
  },
  {
    path: 'performance',
    loadComponent: () => import('../../shared/components/performance-monitor/performance-monitor.component').then(m => m.PerformanceMonitorComponent)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
