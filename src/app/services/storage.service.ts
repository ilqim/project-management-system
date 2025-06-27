import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private storageChangeSubject = new BehaviorSubject<string>('');
  public storageChange$ = this.storageChangeSubject.asObservable();

  constructor() {
    // Simulate storage changes for real-time updates
    setInterval(() => {
      this.storageChangeSubject.next('update');
    }, 5000);
  }

  set(key: string, value: any): void {
    try {
      const encrypted = this.encrypt(JSON.stringify(value));
      localStorage.setItem(key, encrypted);
      this.storageChangeSubject.next(key);
    } catch (error) {
      console.error('Storage set error:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(key);
    this.storageChangeSubject.next(key);
  }

  clear(): void {
    localStorage.clear();
    this.storageChangeSubject.next('clear');
  }

  private encrypt(data: string): string {
    // Encode as base64 but support unicode characters
    return btoa(unescape(encodeURIComponent(data)));
  }

  private decrypt(data: string): string {
    // Decode base64 and restore unicode characters
    return decodeURIComponent(escape(atob(data)));
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
