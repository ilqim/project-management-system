import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(private storage: StorageService) {
    this.loadNotifications();
    this.simulateRealTimeNotifications();
  }

  addNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    const notification: Notification = {
      id: this.storage.generateId(),
      message,
      type,
      timestamp: new Date(),
      read: false
    };

    const notifications = this.notificationsSubject.value;
    notifications.unshift(notification);
    
    // Keep only last 50 notifications
    const trimmed = notifications.slice(0, 50);
    this.notificationsSubject.next(trimmed);
    this.storage.set('notifications', trimmed);
  }

  markAsRead(notificationId: string): void {
    const notifications = this.notificationsSubject.value;
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notificationsSubject.next([...notifications]);
      this.storage.set('notifications', notifications);
    }
  }

  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(notifications);
    this.storage.set('notifications', notifications);
  }

  clearAll(): void {
    this.notificationsSubject.next([]);
    this.storage.set('notifications', []);
  }

  private loadNotifications(): void {
    const notifications = this.storage.get<Notification[]>('notifications') || [];
    this.notificationsSubject.next(notifications);
  }

  private simulateRealTimeNotifications(): void {
    const messages = [
      'Task "API Integration" moved to In Progress',
      'New comment added to "Database Design"',
      'Project deadline approaching in 2 days',
      'Team member John completed "Bug Fix #123"',
      'New task assigned to you: "Code Review"'
    ];

    setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 10 seconds
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.addNotification(randomMessage, 'info');
      }
    }, 10000);
  }
}