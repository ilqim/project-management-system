import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { WorkspaceSelectorComponent } from './components/workspace-selector/workspace-selector.component';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { KanbanBoardComponent } from './components/kanban-board/kanban-board.component';
import { HeaderComponent } from './components/header/header.component';
import { SearchComponent } from './components/search/search.component';
import { TaskCardComponent } from './components/task-card/task-card.component';
import { TaskDetailComponent } from './components/task-detail/task-detail.component';
import { TimeAgoPipe } from './pipes/time-ago.pipe';
import { DurationPipe } from './pipes/duration.pipe';
import { AuthGuard } from './guards/auth.guard';
import { NewProjectComponent } from './components/new-project/new-project.component';
import { NewTaskComponent } from './components/new-task/new-task.component';
import { InviteTeamComponent } from './components/invite-team/invite-team.component';
import { ReportsComponent } from './components/reports/reports.component';
import { ProjectDetailComponent } from './components/project-detail/project-detail.component';
import { RoleGuard } from './guards/role.guard';
import { TasksComponent } from './components/tasks/tasks.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { TeamManagementComponent } from './components/team-management/team-management.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EditProjectComponent } from './components/edit-project/edit-project.component';
import { AcceptInviteComponent } from './components/accept-invite/accept-invite.component';
import { ColumnManagerComponent } from './components/column-manager/column-manager.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    WorkspaceSelectorComponent,
    ProjectListComponent,
    DashboardComponent,
    KanbanBoardComponent,
    HeaderComponent,
    SearchComponent,
    ConfirmDialogComponent,
    TaskCardComponent,
    TaskDetailComponent,
    ProjectDetailComponent,
    TeamManagementComponent,
    NewProjectComponent,
    ColumnManagerComponent,
    NewTaskComponent,
    EditProjectComponent,
    AcceptInviteComponent,
    TasksComponent,
    InviteTeamComponent,
    ReportsComponent,
    TimeAgoPipe,
    DurationPipe
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [AuthGuard, RoleGuard],
  bootstrap: [AppComponent]
})
export class AppModule { }