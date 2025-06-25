import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { DashboardComponent } from './layout/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./core/auth/login/login.component').then(
            (c) => c.LoginComponent
          ),
      },
    ],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./modules/dashboard/dashboard.module').then(
            (m) => m.DashboardModule
          ),
      },

      // {
      //   path: 'users',
      //   loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
      // },
      // {
      //   path: 'messages',
      //   loadChildren: () => import('./features/messages/messaging.module').then(m => m.MessagingModule)
      // },
      // {
      //   path: 'financial-dashboard',
      //   loadComponent: () => import('./features/financial-dashboard/financial-dashboard.component').then(m => m.FinancialDashboardComponent)
      // },
      // {
      //   path: 'reports',
      //   loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
      // },
      // {
      //   path: 'settings',
      //   loadChildren: () => import('./modules/settings/settings.module').then(m => m.SettingsModule)
      // },
      // {
      //   path: 'escalations',
      //   loadComponent: () => import('./features/escalations/escalations.component').then(m => m.EscalationsComponent)
      // },
      // {
      //   path: 'roles',
      //   loadComponent: () => import('./features/roles/roles.component').then(m => m.RolesComponent)
      // },
      // {
      //   path: 'notifications',
      //   loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent)
      // },
      // {
      //   path: 'demo',
      //   loadComponent: () =>
      //     import('./modules/demo/example-table/example-table.component').then(
      //       (m) => m.ExampleTableComponent
      //     ),
      // },
    ],
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
