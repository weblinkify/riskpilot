import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing').then((m) => m.Landing),
    title: 'RiskPilot – AI underwriting workbench',
  },
  {
    path: 'app',
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'Dashboard · RiskPilot',
      },
      {
        path: 'submissions',
        loadComponent: () => import('./pages/inbox/inbox').then((m) => m.Inbox),
        title: 'Submissions · RiskPilot',
      },
      {
        path: 'submissions/:id',
        loadComponent: () =>
          import('./pages/submission/submission-detail').then((m) => m.SubmissionDetail),
        title: 'Submission · RiskPilot',
      },
      {
        path: 'appetite-rules',
        loadComponent: () => import('./pages/rules/rules').then((m) => m.Rules),
        title: 'Appetite rules · RiskPilot',
      },
      {
        path: 'audit',
        loadComponent: () => import('./pages/audit/audit').then((m) => m.Audit),
        title: 'Audit log · RiskPilot',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
