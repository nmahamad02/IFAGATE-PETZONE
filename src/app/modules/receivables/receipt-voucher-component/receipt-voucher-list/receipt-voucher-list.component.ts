import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { AccountsService } from 'src/app/services/accounts/accounts.service';
import { CrmService } from 'src/app/services/crm/crm.service';
import { FinanceService } from 'src/app/services/finance/finance.service';

@Component({
  selector: 'app-receipt-voucher-list',
  templateUrl: './receipt-voucher-list.component.html',
  styleUrls: ['./receipt-voucher-list.component.scss']
})
export class ReceiptVoucherListComponent {

  currentYear = new Date().getFullYear()

  searchValue: any;
  receiptVoucherList: any[] = [];
  receiptVoucherListDataSource = new MatTableDataSource(this.receiptVoucherList);
  columns: any[];

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild('TABLE', { static: false }) table: ElementRef;

  constructor(private crmservice: CrmService, private router: Router, private accountService: AccountsService, private financeService: FinanceService) {
    this.columns = [ "vcrno", "vcrdate", "narration", "netamount", "Actions"];
    this.financeService.getTranHeadList('RVC').subscribe((res: any) => {
      console.log(res.recordset)
      this.receiptVoucherList = res.recordset;
      this.receiptVoucherListDataSource = new MatTableDataSource(this.receiptVoucherList);
      this.receiptVoucherListDataSource.sort = this.sort;
      this.receiptVoucherListDataSource.paginator = this.paginator;
    }, (error: any) => {
      console.log(error);
    });
  }

  ngOnInit(): void {
    
  }

  quickReceiptVoucherSearch() {
    this.receiptVoucherListDataSource.filter = this.searchValue.trim().toLowerCase();
  }

  public gotoReceiptVoucherDetails(url: any, id: any) {
    var myurl = `${url}/${id}`;
    this.router.navigateByUrl(myurl).then(e => {
    });
  }


}
