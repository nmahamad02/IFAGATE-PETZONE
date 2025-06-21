import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupplierMasterComponent } from './supplier-component/supplier-master/supplier-master.component';
import { SupplierDetailComponent } from './supplier-component/supplier-detail/supplier-detail.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTreeModule } from '@angular/material/tree';
import { RouterModule } from '@angular/router';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { PaymentVoucherDetailComponent } from './payment-voucher-component/payment-voucher-detail/payment-voucher-detail.component';
import { PaymentVoucherListComponent } from './payment-voucher-component/payment-voucher-list/payment-voucher-list.component';
import { SharedModule } from '../shared/shared.module';

export const payablesRoutes = [
  {
    path: 'supplier-master',
    component: SupplierMasterComponent
  } ,
  {
    path: 'supplier/detail/:pcode',
    component: SupplierDetailComponent
  },
  {
    path: 'payment-voucher',
    component: PaymentVoucherListComponent
  } ,
  {
    path: 'payment-voucher/detail/:id',
    component: PaymentVoucherDetailComponent
  }
];

@NgModule({
  declarations: [
    SupplierMasterComponent,
    SupplierDetailComponent,
    PaymentVoucherDetailComponent,
    PaymentVoucherListComponent,
  ],
  imports: [
    MatIconModule,
    CommonModule,
    SharedModule,
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
    RouterModule.forChild(payablesRoutes),
  ]
})
export class PayablesModule { }
