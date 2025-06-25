import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { AuthService } from 'src/app/core/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  navItems = [
    {
      label: 'Command Center',
      icon: 'dashboard',
      route: '/dashboard',
      hasChildren: false,
    },
    {
      label: 'Messages',
      icon: 'message',
      route: '/dashboard/messages',
      hasChildren: false,
    },
    {
      label: 'Users',
      icon: 'people',
      route: '/dashboard/users',
      hasChildren: false,
    },
    {
      label: 'Financial Dashboard',
      icon: 'assessment',
      route: '/dashboard/financial-dashboard',
      hasChildren: false,
    },
    {
      label: 'Reports',
      icon: 'bar_chart',
      route: '/dashboard/reports',
      hasChildren: false,
    },
    {
      label: 'Settings',
      icon: 'settings',
      route: '/dashboard/settings',
      hasChildren: true,
      children: [
        { label: 'Master Settings', route: '/dashboard/settings/master' },
      ],
    },
    {
      label: 'General Table',
      icon: 'dashboard',
      route: '/dashboard/demo',
      hasChildren: false,
    },
    {
      label: 'Notifications',
      icon: 'notifications',
      route: '/dashboard/notifications',
      hasChildren: false,
    },
  ];

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
