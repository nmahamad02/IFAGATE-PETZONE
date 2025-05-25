import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { AccountsService } from 'src/app/services/accounts/accounts.service';
import { CrmService } from 'src/app/services/crm/crm.service';
import { FinanceService } from 'src/app/services/finance/finance.service';

@Component({
  selector: 'app-payment-voucher-list',
  templateUrl: './payment-voucher-list.component.html',
  styleUrls: ['./payment-voucher-list.component.scss']
})
export class PaymentVoucherListComponent {

  currentYear = new Date().getFullYear()

  searchValue: any;
  paymentVoucherList: any[] = [];
  paymentVoucherListDataSource = new MatTableDataSource(this.paymentVoucherList);
  columns: any[];

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild('TABLE', { static: false }) table: ElementRef;

  constructor(private crmservice: CrmService, private router: Router, private accountService: AccountsService, private financeService: FinanceService) {
    this.columns = [ "vcrno", "vcrdate", "narration", "netamount", "Actions"];
    this.financeService.getTranHeadList('PVC').subscribe((res: any) => {
      console.log(res.recordset)
      this.paymentVoucherList = res.recordset;
      this.paymentVoucherListDataSource = new MatTableDataSource(this.paymentVoucherList);
      this.paymentVoucherListDataSource.sort = this.sort;
      this.paymentVoucherListDataSource.paginator = this.paginator;
    }, (error: any) => {
      console.log(error);
    });
  }

  ngOnInit(): void {
    
  }

  quickPaymentVoucherSearch() {
    this.paymentVoucherListDataSource.filter = this.searchValue.trim().toLowerCase();
  }

  public gotoPaymentVoucherDetails(url: any, id: any) {
    var myurl = `${url}/${id}`;
    this.router.navigateByUrl(myurl).then(e => {
    });
  }


}
