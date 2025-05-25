import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { AccountsService } from 'src/app/services/accounts/accounts.service';
import { CrmService } from 'src/app/services/crm/crm.service';
import { FinanceService } from 'src/app/services/finance/finance.service';

@Component({
  selector: 'app-journal-voucher-list',
  templateUrl: './journal-voucher-list.component.html',
  styleUrls: ['./journal-voucher-list.component.scss']
})
export class JournalVoucherListComponent {

  currentYear = new Date().getFullYear()

  searchValue: any;
  journalVoucherList: any[] = [];
  journalVoucherListDataSource = new MatTableDataSource(this.journalVoucherList);
  columns: any[];

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild('TABLE', { static: false }) table: ElementRef;

  constructor(private crmservice: CrmService, private router: Router, private accountService: AccountsService, private financeService: FinanceService) {
    this.columns = [ "vcrno", "vcrdate", "narration", "netamount", "Actions"];
    this.financeService.getTranHeadList('JVC').subscribe((res: any) => {
      console.log(res.recordset)
      this.journalVoucherList = res.recordset;
      this.journalVoucherListDataSource = new MatTableDataSource(this.journalVoucherList);
      this.journalVoucherListDataSource.sort = this.sort;
      this.journalVoucherListDataSource.paginator = this.paginator;
    }, (error: any) => {
      console.log(error);
    });
  }

  ngOnInit(): void {
    
  }

  quickJournalVoucherSearch() {
    this.journalVoucherListDataSource.filter = this.searchValue.trim().toLowerCase();
  }

  public gotoJournalVoucherDetails(url: any, id: any) {
    var myurl = `${url}/${id}`;
    this.router.navigateByUrl(myurl).then(e => {
    });
  }


}
