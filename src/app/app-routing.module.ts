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
import { RoleGuard } from './guards/role.guard';
import { UserRole } from './models/user.model';
import { KanbanBoardComponent } from './components/kanban-board/kanban-board.component';
import { TasksComponent } from './components/tasks/tasks.component';
import { TeamManagementComponent } from './components/team-management/team-management.component';
import { EditProjectComponent } from './components/edit-project/edit-project.component';
import { AcceptInviteComponent } from './components/accept-invite/accept-invite.component';


const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'projects/:id/kanban', component: KanbanBoardComponent, canActivate: [AuthGuard] },
  { path: 'workspaces', component: WorkspaceSelectorComponent, canActivate: [AuthGuard] },
  { path: 'projects', component: ProjectListComponent, canActivate: [AuthGuard] },
  { path: 'invite/:token', component: AcceptInviteComponent },
  { path: 'tasks/edit/:id', component: NewTaskComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [UserRole.ADMIN, UserRole.PROJECT_LEAD] } },
  { path: 'invites', component: AcceptInviteComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [UserRole.PROJECT_LEAD, UserRole.DEVELOPER] } },
  { path: 'projects/edit/:id', component: EditProjectComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [UserRole.ADMIN, UserRole.PROJECT_LEAD] } },
  { path: 'projects/new', component: NewProjectComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [UserRole.ADMIN, UserRole.PROJECT_LEAD] } },
  { path: 'tasks/new', component: NewTaskComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [UserRole.ADMIN, UserRole.PROJECT_LEAD] } },
  { path: 'projects/:id', component: ProjectDetailComponent, canActivate: [AuthGuard] },
  { path: 'tasks', component: TasksComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [UserRole.ADMIN, UserRole.PROJECT_LEAD, UserRole.DEVELOPER, UserRole.VIEWER] } },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'team/invite', component: InviteTeamComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [UserRole.ADMIN, UserRole.PROJECT_LEAD] } },
  { path: 'team/manage', component: TeamManagementComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [UserRole.ADMIN, UserRole.PROJECT_LEAD] } },
  { path: 'reports', component: ReportsComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [UserRole.ADMIN] } }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }