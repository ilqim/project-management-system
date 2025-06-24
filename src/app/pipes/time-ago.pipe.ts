import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeAgo' })
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const intervals: { [key: string]: number } = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };
    for (const i in intervals) {
      const counter = Math.floor(seconds / intervals[i]);
      if (counter > 0) {
        return counter + ' ' + i + (counter > 1 ? 's' : '') + ' ago';
      }
    }
    return 'just now';
  }
}