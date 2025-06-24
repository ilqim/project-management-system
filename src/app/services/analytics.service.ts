// src/app/services/analytics.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { Task, TaskPriority } from '../models/task.model';
import { Project } from '../models/project.model';
import { User } from '../models/user.model';

export interface ProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  averageCycleTime: number; // days
  averageLeadTime: number; // days
  throughput: number; // tasks per week
  burndown: BurndownData[];
  teamPerformance: TeamMemberPerformance[];
  priorityDistribution: PriorityDistribution[];
  weeklyProgress: WeeklyProgress[];
}

export interface BurndownData {
  date: Date;
  remaining: number;
  ideal: number;
}

export interface TeamMemberPerformance {
  userId: string;
  name: string;
  tasksCompleted: number;
  totalHours: number;
  averageTaskTime: number;
  efficiency: number; // percentage
}

export interface PriorityDistribution {
  priority: TaskPriority;
  count: number;
  percentage: number;
}

export interface WeeklyProgress {
  week: string;
  completed: number;
  created: number;
}

export interface TimeMetrics {
  totalTimeSpent: number; // hours
  averageTaskTime: number; // hours
  timeByPriority: { [key: string]: number };
  timeByUser: { [key: string]: number };
  dailyTimeEntries: DailyTimeEntry[];
}

export interface DailyTimeEntry {
  date: string;
  hours: number;
  tasks: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(private storage: StorageService) {}

  getProjectMetrics(projectId: string): Observable<ProjectMetrics> {
    return new Observable(observer => {
      const tasks = this.storage.get<Task[]>('tasks') || [];
      const users = this.storage.get<User[]>('users') || [];
      const projectTasks = tasks.filter(t => t.projectId === projectId);

      const metrics: ProjectMetrics = {
        totalTasks: projectTasks.length,
        completedTasks: projectTasks.filter(t => t.columnId === 'done').length,
        inProgressTasks: projectTasks.filter(t => t.columnId === 'in-progress').length,
        overdueTasks: this.getOverdueTasks(projectTasks).length,
        averageCycleTime: this.calculateAverageCycleTime(projectTasks),
        averageLeadTime: this.calculateAverageLeadTime(projectTasks),
        throughput: this.calculateThroughput(projectTasks),
        burndown: this.generateBurndownData(projectTasks),
        teamPerformance: this.calculateTeamPerformance(projectTasks, users),
        priorityDistribution: this.calculatePriorityDistribution(projectTasks),
        weeklyProgress: this.calculateWeeklyProgress(projectTasks)
      };

      observer.next(metrics);
      observer.complete();
    });
  }

  getTimeMetrics(projectId?: string): Observable<TimeMetrics> {
    return new Observable(observer => {
      const tasks = this.storage.get<Task[]>('tasks') || [];
      const filteredTasks = projectId ? tasks.filter(t => t.projectId === projectId) : tasks;
      const users = this.storage.get<User[]>('users') || [];

      const allTimeEntries = filteredTasks.flatMap(t => t.timeEntries);
      const totalMinutes = allTimeEntries.reduce((sum, te) => sum + te.duration, 0);
      const totalHours = Math.round(totalMinutes / 60 * 100) / 100;

      const metrics: TimeMetrics = {
        totalTimeSpent: totalHours,
        averageTaskTime: filteredTasks.length > 0 ? totalHours / filteredTasks.length : 0,
        timeByPriority: this.calculateTimeByPriority(filteredTasks),
        timeByUser: this.calculateTimeByUser(filteredTasks, users),
        dailyTimeEntries: this.calculateDailyTimeEntries(allTimeEntries)
      };

      observer.next(metrics);
      observer.complete();
    });
  }

  getVelocityData(projectId: string, weeks: number = 8): Observable<number[]> {
    return new Observable(observer => {
      const tasks = this.storage.get<Task[]>('tasks') || [];
      const projectTasks = tasks.filter(t => t.projectId === projectId && t.completedAt);
      
      const velocity = this.calculateVelocity(projectTasks, weeks);
      observer.next(velocity);
      observer.complete();
    });
  }

  predictProjectCompletion(projectId: string): Observable<Date | null> {
    return new Observable(observer => {
      const tasks = this.storage.get<Task[]>('tasks') || [];
      const projectTasks = tasks.filter(t => t.projectId === projectId);
      
      const completedTasks = projectTasks.filter(t => t.completedAt);
      const remainingTasks = projectTasks.filter(t => !t.completedAt);
      
      if (completedTasks.length === 0 || remainingTasks.length === 0) {
        observer.next(null);
        observer.complete();
        return;
      }

      // Calculate average completion rate (tasks per day)
      const oldestCompletion = completedTasks.reduce((oldest, task) => 
        task.completedAt! < oldest ? task.completedAt! : oldest, completedTasks[0].completedAt!);
      
      const daysSinceStart = Math.max(1, Math.floor((Date.now() - oldestCompletion.getTime()) / (1000 * 60 * 60 * 24)));
      const completionRate = completedTasks.length / daysSinceStart;
      
      const daysToComplete = Math.ceil(remainingTasks.length / Math.max(0.1, completionRate));
      const estimatedCompletion = new Date();
      estimatedCompletion.setDate(estimatedCompletion.getDate() + daysToComplete);
      
      observer.next(estimatedCompletion);
      observer.complete();
    });
  }

  exportAnalytics(projectId: string): Observable<string> {
    return new Observable(observer => {
      this.getProjectMetrics(projectId).subscribe(metrics => {
        const csvData = this.convertToCSV(metrics);
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        observer.next(url);
        observer.complete();
      });
    });
  }

  private getOverdueTasks(tasks: Task[]): Task[] {
    const now = new Date();
    return tasks.filter(t => t.dueDate && t.dueDate < now && t.columnId !== 'done');
  }

  private calculateAverageCycleTime(tasks: Task[]): number {
    const completedTasks = tasks.filter(t => t.completedAt && t.createdAt);
    if (completedTasks.length === 0) return 0;

    const totalCycleTime = completedTasks.reduce((sum, task) => {
      const cycleTime = Math.floor((task.completedAt!.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return sum + cycleTime;
    }, 0);

    return Math.round(totalCycleTime / completedTasks.length * 100) / 100;
  }

  private calculateAverageLeadTime(tasks: Task[]): number {
    // For this demo, lead time equals cycle time
    return this.calculateAverageCycleTime(tasks);
  }

  private calculateThroughput(tasks: Task[]): number {
    const completedTasks = tasks.filter(t => t.completedAt);
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const recentlyCompleted = completedTasks.filter(t => t.completedAt! >= lastWeek);
    return recentlyCompleted.length;
  }

  private generateBurndownData(tasks: Task[]): BurndownData[] {
    const project = this.storage.get<Project[]>('projects')?.find(p => 
      tasks.length > 0 && p.id === tasks[0].projectId
    );
    
    if (!project || !project.startDate) return [];

    const startDate = new Date(project.startDate);
    const endDate = project.endDate || new Date();
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalTasks = tasks.length;
    
    const burndownData: BurndownData[] = [];
    
    for (let day = 0; day <= Math.min(totalDays, 30); day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      
      const completedByDate = tasks.filter(t => 
        t.completedAt && t.completedAt <= currentDate
      ).length;
      
      const remaining = totalTasks - completedByDate;
      const ideal = Math.max(0, totalTasks - (totalTasks / totalDays) * day);
      
      burndownData.push({
        date: new Date(currentDate),
        remaining,
        ideal: Math.round(ideal)
      });
    }
    
    return burndownData;
  }

  private calculateTeamPerformance(tasks: Task[], users: User[]): TeamMemberPerformance[] {
    const userPerformance = new Map<string, TeamMemberPerformance>();
    
    users.forEach(user => {
      const userTasks = tasks.filter(t => t.assigneeId === user.id);
      const completedTasks = userTasks.filter(t => t.completedAt);
      const totalMinutes = userTasks.flatMap(t => t.timeEntries).reduce((sum, te) => sum + te.duration, 0);
      const totalHours = Math.round(totalMinutes / 60 * 100) / 100;
      
      userPerformance.set(user.id, {
        userId: user.id,
        name: user.name,
        tasksCompleted: completedTasks.length,
        totalHours,
        averageTaskTime: completedTasks.length > 0 ? totalHours / completedTasks.length : 0,
        efficiency: this.calculateEfficiency(userTasks)
      });
    });
    
    return Array.from(userPerformance.values()).filter(p => p.tasksCompleted > 0);
  }

  private calculateEfficiency(tasks: Task[]): number {
    const completedTasks = tasks.filter(t => t.completedAt);
    if (completedTasks.length === 0) return 0;
    
    const onTimeCompletion = completedTasks.filter(t => 
      !t.dueDate || t.completedAt! <= t.dueDate
    ).length;
    
    return Math.round((onTimeCompletion / completedTasks.length) * 100);
  }

  private calculatePriorityDistribution(tasks: Task[]): PriorityDistribution[] {
    const priorityCounts = new Map<TaskPriority, number>();
    
    // Initialize counts
    Object.values(TaskPriority).forEach(priority => {
      priorityCounts.set(priority, 0);
    });
    
    // Count tasks by priority
    tasks.forEach(task => {
      const current = priorityCounts.get(task.priority) || 0;
      priorityCounts.set(task.priority, current + 1);
    });
    
    // Convert to percentage
    const total = tasks.length;
    return Array.from(priorityCounts.entries()).map(([priority, count]) => ({
      priority,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }

  private calculateWeeklyProgress(tasks: Task[]): WeeklyProgress[] {
    const weeklyData = new Map<string, { completed: number; created: number }>();
    
    // Initialize last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      const weekKey = this.getWeekKey(date);
      weeklyData.set(weekKey, { completed: 0, created: 0 });
    }
    
    tasks.forEach(task => {
      // Count created tasks
      const createdWeek = this.getWeekKey(task.createdAt);
      if (weeklyData.has(createdWeek)) {
        weeklyData.get(createdWeek)!.created++;
      }
      
      // Count completed tasks
      if (task.completedAt) {
        const completedWeek = this.getWeekKey(task.completedAt);
        if (weeklyData.has(completedWeek)) {
          weeklyData.get(completedWeek)!.completed++;
        }
      }
    });
    
    return Array.from(weeklyData.entries()).map(([week, data]) => ({
      week,
      completed: data.completed,
      created: data.created
    }));
  }

  private calculateTimeByPriority(tasks: Task[]): { [key: string]: number } {
    const timeByPriority: { [key: string]: number } = {};
    
    tasks.forEach(task => {
      const totalMinutes = task.timeEntries.reduce((sum, te) => sum + te.duration, 0);
      const hours = Math.round(totalMinutes / 60 * 100) / 100;
      
      if (!timeByPriority[task.priority]) {
        timeByPriority[task.priority] = 0;
      }
      timeByPriority[task.priority] += hours;
    });
    
    return timeByPriority;
  }

  private calculateTimeByUser(tasks: Task[], users: User[]): { [key: string]: number } {
    const timeByUser: { [key: string]: number } = {};
    
    users.forEach(user => {
      const userTasks = tasks.filter(t => t.assigneeId === user.id);
      const totalMinutes = userTasks.flatMap(t => t.timeEntries).reduce((sum, te) => sum + te.duration, 0);
      const hours = Math.round(totalMinutes / 60 * 100) / 100;
      
      if (hours > 0) {
        timeByUser[user.name] = hours;
      }
    });
    
    return timeByUser;
  }

  private calculateDailyTimeEntries(timeEntries: any[]): DailyTimeEntry[] {
    const dailyData = new Map<string, { hours: number; tasks: Set<string> }>();
    
    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyData.set(dateKey, { hours: 0, tasks: new Set() });
    }
    
    timeEntries.forEach(entry => {
      if (entry.endTime) {
        const dateKey = entry.startTime.toISOString().split('T')[0];
        if (dailyData.has(dateKey)) {
          const data = dailyData.get(dateKey)!;
          data.hours += entry.duration / 60;
          // Note: We don't have taskId in timeEntry, so we'll use a placeholder
          data.tasks.add(entry.id);
        }
      }
    });
    
    return Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      hours: Math.round(data.hours * 100) / 100,
      tasks: data.tasks.size
    }));
  }

  private calculateVelocity(completedTasks: Task[], weeks: number): number[] {
    const velocity: number[] = [];
    
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7) - 6);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      weekEnd.setHours(23, 59, 59, 999);
      
      const weeklyCompleted = completedTasks.filter(t => 
        t.completedAt! >= weekStart && t.completedAt! <= weekEnd
      ).length;
      
      velocity.push(weeklyCompleted);
    }
    
    return velocity;
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private convertToCSV(metrics: ProjectMetrics): string {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Tasks', metrics.totalTasks.toString()],
      ['Completed Tasks', metrics.completedTasks.toString()],
      ['In Progress Tasks', metrics.inProgressTasks.toString()],
      ['Overdue Tasks', metrics.overdueTasks.toString()],
      ['Average Cycle Time (days)', metrics.averageCycleTime.toString()],
      ['Average Lead Time (days)', metrics.averageLeadTime.toString()],
      ['Weekly Throughput', metrics.throughput.toString()]
    ];
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}