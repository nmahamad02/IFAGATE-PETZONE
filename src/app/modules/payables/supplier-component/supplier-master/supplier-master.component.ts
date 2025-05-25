import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { AccountsService } from 'src/app/services/accounts/accounts.service';
import { CrmService } from 'src/app/services/crm/crm.service';

@Component({
  selector: 'app-supplier-master',
  templateUrl: './supplier-master.component.html',
  styleUrls: ['./supplier-master.component.scss']
})
export class SupplierMasterComponent {
  currentYear = new Date().getFullYear()

  searchValue: any;
  supplierList: any[] = [];
  supplierListDataSource = new MatTableDataSource(this.supplierList);
  columns: any[];

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild('TABLE', { static: false }) table: ElementRef;

  constructor(private crmservice: CrmService, private router: Router, private accountService: AccountsService) {
    this.columns = [ "pcode", "name", "mobile", "opbal", "Actions"];
  }

  ngOnInit(): void {
    this.accountService.listOpbal(this.currentYear.toString(),'S').subscribe((res: any) => {
      console.log(res.recordset)
      this.supplierList = res.recordset;
      this.supplierListDataSource = new MatTableDataSource(this.supplierList);
      this.supplierListDataSource.sort = this.sort;
      this.supplierListDataSource.paginator = this.paginator;
    }, (error: any) => {
      console.log(error);
    });
  }

  quicksupplierSearch() {
    this.supplierListDataSource.filter = this.searchValue.trim().toLowerCase();
  }

  public gotoSupplierDetails(url: any, id: any) {
    var myurl = `${url}/${id}`;
    this.router.navigateByUrl(myurl).then(e => {
    });
  }


}
