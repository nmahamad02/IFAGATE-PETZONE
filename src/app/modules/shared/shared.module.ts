import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbsPipe } from 'src/app/pipes/abs.pipe';
import { FilterTablePipe } from 'src/app/pipes/filterTable.pipe';

@NgModule({
  declarations: [AbsPipe, FilterTablePipe],
  imports: [CommonModule],
  exports: [AbsPipe, FilterTablePipe] // Export so others can use
})
export class SharedModule { }
