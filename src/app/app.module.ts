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
    TaskCardComponent,
    TaskDetailComponent,
    ProjectDetailComponent,
    NewProjectComponent,
    NewTaskComponent,
    InviteTeamComponent,
    ReportsComponent,
    TimeAgoPipe,
    DurationPipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [AuthGuard],
  bootstrap: [AppComponent]
})
export class AppModule { }