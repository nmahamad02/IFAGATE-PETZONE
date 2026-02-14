import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbsPipe } from 'src/app/pipes/abs.pipe';
import { FilterTablePipe } from 'src/app/pipes/filterTable.pipe';
import { UniquePipe } from 'src/app/pipes/uniquePipe.pipe';

@NgModule({
  declarations: [AbsPipe, FilterTablePipe, UniquePipe],
  imports: [CommonModule],
  exports: [AbsPipe, FilterTablePipe, UniquePipe] // Export so others can use
})
export class SharedModule { }
