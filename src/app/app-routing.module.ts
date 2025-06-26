import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { WorkspaceSelectorComponent } from './components/workspace-selector/workspace-selector.component';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NewProjectComponent } from './components/new-project/new-project.component';
import { NewTaskComponent } from './components/new-task/new-task.component';
import { InviteTeamComponent } from './components/invite-team/invite-team.component';
import { ReportsComponent } from './components/reports/reports.component';
import { ProjectDetailComponent } from './components/project-detail/project-detail.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'workspaces', component: WorkspaceSelectorComponent, canActivate: [AuthGuard] },
  { path: 'projects', component: ProjectListComponent, canActivate: [AuthGuard] },
  { path: 'projects/new', component: NewProjectComponent, canActivate: [AuthGuard] },
  { path: 'tasks/new', component: NewTaskComponent, canActivate: [AuthGuard] },
  { path: 'projects/:id', component: ProjectDetailComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'team/invite', component: InviteTeamComponent, canActivate: [AuthGuard] },
  { path: 'reports', component: ReportsComponent, canActivate: [AuthGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }