import { Component, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { AccountsService } from 'src/app/services/accounts/accounts.service';
import { CrmService } from 'src/app/services/crm/crm.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-customer-master',
  templateUrl: './customer-master.component.html',
  styleUrls: ['./customer-master.component.scss']
})
export class CustomerMasterComponent {

  @ViewChild('customerLookupDialog', { static: false }) customerLookupDialog!: TemplateRef<any>;

  currentYear = new Date().getFullYear()

  searchValue: any;
  customerList: any[] = [];
  customerListDataSource = new MatTableDataSource(this.customerList);
  columns: any[];

  tableData: any[] = [];
  displayedColumns: string[] = [];

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild('TABLE', { static: false }) table: ElementRef;

  constructor(private crmservice: CrmService, private router: Router,  private dialog: MatDialog, private accountService: AccountsService) {
    this.columns = [ "pcode", "name", "mobile", "opbal", "Actions"];
  }

  ngOnInit(): void {
    this.accountService.listOpbal(this.currentYear.toString(),'S').subscribe((res: any) => {
      console.log(res.recordset)
      this.customerList = res.recordset;
      this.customerListDataSource = new MatTableDataSource(this.customerList);
      this.customerListDataSource.sort = this.sort;
      this.customerListDataSource.paginator = this.paginator;
    }, (error: any) => {
      console.log(error);
    });
  }

  quickcustomerSearch() {
    this.customerListDataSource.filter = this.searchValue.trim().toLowerCase();
  }

  public gotocustomerDetails(url: any, id: any) {
    var myurl = `${url}/${id}`;
    this.router.navigateByUrl(myurl).then(e => {
    });
  }

  openUploadExcelSheet(){
    let dialogRef = this.dialog.open(this.customerLookupDialog, {
      width: '80vw',  // 80% of viewport width
      maxHeight: '80vh',  // 80% of viewport height
    });
  }

  onFileChange(event: any): void {
    const target: DataTransfer = <DataTransfer>event.target;
    if (target.files.length !== 1) return;

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const binaryStr: string = e.target.result;
      const workbook: XLSX.WorkBook = XLSX.read(binaryStr, { type: 'binary' });

      const sheetName: string = workbook.SheetNames[0]; // Read first sheet
      const worksheet: XLSX.WorkSheet = workbook.Sheets[sheetName];

      this.tableData = XLSX.utils.sheet_to_json(worksheet);
      this.displayedColumns = this.tableData.length ? Object.keys(this.tableData[0]) : [];
    };

    reader.readAsBinaryString(target.files[0]);
  }

}