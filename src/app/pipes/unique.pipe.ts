import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ 
    name: 'unique'
})
export class UniquePipe implements PipeTransform {
  transform(items: any[], field: string): any[] {
    if (!items) return [];
    return Array.from(new Set(items.map(i => i[field])));
  }
}
