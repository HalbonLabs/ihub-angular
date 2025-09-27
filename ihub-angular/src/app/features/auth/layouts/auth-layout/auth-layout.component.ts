import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss'
})
export class AuthLayoutComponent {
  appName = environment.appName;
  currentYear = new Date().getFullYear();
  
  features = [
    { icon: '📋', title: 'Inspection Management', description: 'Streamline your property inspections' },
    { icon: '📊', title: 'Real-time Analytics', description: 'Track performance and metrics' },
    { icon: '📱', title: 'Mobile Ready', description: 'Access from any device, anywhere' },
    { icon: '🔒', title: 'Secure & Compliant', description: 'Enterprise-grade security' }
  ];
}
