import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(value: number | undefined): string {
    if (!value) return '0m';
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
}