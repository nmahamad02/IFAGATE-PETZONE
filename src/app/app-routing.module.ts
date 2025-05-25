import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from './guards/authenticator/auth.guard';
import { AccessGuard } from './guards/access/access.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: localStorage.getItem('username') ? 'dashboard' : 'authentication/login',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard] // Protect dashboard with AuthGuard
  },
  /*{
    path: 'agm',
    loadChildren: () => import('./modules/agm/agm.module').then(m => m.AgmModule),
   // canActivate: [AccessGuard]
  },*/
  {
    path: 'authentication',
    loadChildren: () => import('./modules/authentication/authentication.module').then(m => m.AuthenticationModule)
  },
  {
    path: 'finance',
    loadChildren: () => import('./modules/finance/finance.module').then(m => m.FinanceModule)
  },
  {
    path: 'payables',
    loadChildren: () => import('./modules/payables/payables.module').then(m => m.PayablesModule)
  },
  {
    path: 'receivables',
    loadChildren: () => import('./modules/receivables/receivables.module').then(m => m.ReceivablesModule)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
