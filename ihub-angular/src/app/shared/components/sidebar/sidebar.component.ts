import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
// Temporarily disabled Material imports for build compatibility
// import { MatSidenavModule } from '@angular/material/sidenav';
// import { MatListModule } from '@angular/material/list';
// import { MatIconModule } from '@angular/material/icon';
// import { MatBadgeModule } from '@angular/material/badge';
// import { MatExpansionModule } from '@angular/material/expansion';
// import { MatTooltipModule } from '@angular/material/tooltip';
// import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserRole } from '../../../core/models/auth.model';
import { NavigationItem, NAVIGATION_CONFIG, filterNavigationByRole } from '../../config/navigation.config';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
    // Temporarily disabled Material modules for build compatibility
    // MatSidenavModule,
    // MatListModule,
    // MatIconModule,
    // MatBadgeModule,
    // MatExpansionModule,
    // MatTooltipModule,
    // MatDividerModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();
  
  user: User | null = null;
  navigationItems: NavigationItem[] = [];
  appName = environment.appName;
  appVersion = environment.appVersion;
  isCollapsed = false;
  expandedItems: Set<string> = new Set();
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to user changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
        this.updateNavigationItems();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateNavigationItems(): void {
    if (this.user) {
      this.navigationItems = filterNavigationByRole(NAVIGATION_CONFIG, this.user.role);
    } else {
      this.navigationItems = [];
    }
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    this.toggleSidebar.emit();
    
    // Clear expanded items when collapsing
    if (this.isCollapsed) {
      this.expandedItems.clear();
    }
  }

  toggleExpanded(itemId: string): void {
    if (this.expandedItems.has(itemId)) {
      this.expandedItems.delete(itemId);
    } else {
      this.expandedItems.add(itemId);
    }
  }

  isExpanded(itemId: string): boolean {
    return this.expandedItems.has(itemId);
  }

  isActive(item: NavigationItem): boolean {
    if (!item.route) return false;
    return this.router.url.startsWith(item.route);
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  getUserRoleLabel(): string {
    if (!this.user) return '';
    
    switch (this.user.role) {
      case UserRole.ADMIN:
        return 'Administrator';
      case UserRole.INSPECTOR:
        return 'Inspector';
      case UserRole.VIEWER:
        return 'Viewer';
      default:
        return '';
    }
  }

  getUserInitials(): string {
    if (!this.user) return '?';
    
    const names = this.user.fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return this.user.fullName.substring(0, 2).toUpperCase();
  }
}
