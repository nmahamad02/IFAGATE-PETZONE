import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterTable'
})
export class FilterTablePipe implements PipeTransform {

  transform(items: any[], searchText: string): any[] {
    if (!items || !searchText) return items;

    searchText = searchText.toLowerCase();

    return items.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(searchText)
      )
    );
  }
}
