import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneralLedgerComponent } from './general-ledger-component/general-ledger/general-ledger.component';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { NgChartsModule } from 'ng2-charts';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTreeModule } from '@angular/material/tree';
import { GeneralLedgerDetailComponent } from './general-ledger-component/general-ledger-detail/general-ledger-detail.component';
import { JournalVoucherListComponent } from './journal-voucher-component/journal-voucher-list/journal-voucher-list.component';
import { JournalVoucherDetailComponent } from './journal-voucher-component/journal-voucher-detail/journal-voucher-detail.component';
import { FilterTablePipe } from '../../pipes/filterTable.pipe';
import { ReportsComponent } from './finance-report-component/reports/reports.component';

export const financeRoutes = [
  {
    path: 'general-ledger',
    component: GeneralLedgerComponent
  } ,
  {
    path: 'general-ledger/detail/:id',
    component: GeneralLedgerDetailComponent
  },
  {
    path: 'journal-voucher',
    component: JournalVoucherListComponent
  } ,
  {
    path: 'journal-voucher/detail/:id',
    component: JournalVoucherDetailComponent
  },
  {
    path: 'Financial-Reports',
    component: ReportsComponent
  }
];

@NgModule({
  declarations: [
    GeneralLedgerComponent,
    GeneralLedgerDetailComponent,
    JournalVoucherListComponent,
    JournalVoucherDetailComponent,
    FilterTablePipe,
    ReportsComponent  
  ],
  imports: [
    MatIconModule,
    CommonModule,
    NgChartsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatExpansionModule,
    MatInputModule,
    MatDatepickerModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatPaginatorModule,
    MatDividerModule,
    MatTreeModule,
    MatSortModule,
    FormsModule,
    PdfViewerModule,
    ReactiveFormsModule,
    RouterModule.forChild(financeRoutes),
  ]
})
export class FinanceModule { }
