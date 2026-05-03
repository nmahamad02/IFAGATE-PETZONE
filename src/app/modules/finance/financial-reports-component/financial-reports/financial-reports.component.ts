import { Component, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountsService } from 'src/app/services/accounts/accounts.service';
import { DataSharingService } from 'src/app/services/data-sharing/data-sharing.service';
import { FinanceService } from 'src/app/services/finance/finance.service';
import { ReportsService } from 'src/app/services/reports/reports.service';
import { SapService } from 'src/app/services/SAP/sap.service';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-financial-reports',
  templateUrl: './financial-reports.component.html',
  styleUrls: ['./financial-reports.component.scss']
})
export class FinancialReportsComponent {

  userRight = localStorage.getItem('userright')!

  @ViewChild('locmosLookupDialog', { static: false }) locmosLookupDialog!: TemplateRef<any>;
  @ViewChild('mossumLookupDialog', { static: false }) mossumLookupDialog!: TemplateRef<any>;
  @ViewChild('lwpsLookupDialog', { static: false }) lwpsLookupDialog!: TemplateRef<any>;

  currentYear = new Date().getFullYear()
  mCurDate = this.formatDate(new Date())

  yearList: number[] = [];
  selectedYear: number = new Date().getFullYear();

  locmosData: any[] = []
  locGroupedData: { location: string, rows: any[], subtotal: number }[] = [];
  mossumData: any[] = []
  lwpsData: any[] = [];
  lwpsGroupedData: any[] = [];


  groupedData: any[] = [];
  grandTotal: number = 0;

  locationList: any[] = [];
  customerList: any[] = [];

  selectedLocation: string = 'NULL'
  selectedCustomer: string = 'NULL'

  startDate = '2026-01-01'
  endDate = '2026-12-31'

  getData: boolean = false;

  //searchText = ''

  constructor(private financeService: FinanceService, private route: ActivatedRoute, private dialog: MatDialog, private router: Router, private accountService: AccountsService, private reportService: ReportsService, private dataSharingService: DataSharingService, private sapservice: SapService) { 
    console.log(this.userRight)
    this.reportService.getLocation().subscribe((res: any) => {
      this.locationList = res.recordset
      console.log(this.locationList)
    })
  }

  ngOnInit() {
  const currentYear = new Date().getFullYear();
  this.yearList = Array.from({ length: 7 }, (_, i) => currentYear - i);
  this.selectedYear = currentYear;
}

  openLOCMOS() {
    let dialogRef = this.dialog.open(this.locmosLookupDialog);
    this.locmosData = []
    this.locGroupedData = []
  }

getLOCMOS(location: any) {
  this.getData = true;
  this.selectedLocation = location;

  // Build year range internally
  const startDate = `${this.selectedYear}-01-01`;
  const endDate = `${this.selectedYear}-12-31`;

  this.reportService
    .getLocationwiseMonthlySales(location)
    .subscribe((res: any) => {

      if (!res.recordset || res.recordset.length === 0) {
        alert('No data for selected year');
        this.getData = false;
        return;
      }

      // Filter to selected year WITHOUT touching SQL
      this.locmosData = res.recordset.filter((r: any) =>
        r.MonthYear.startsWith(this.selectedYear.toString())
      );

      this.getData = false;

      // Grouping logic unchanged
      this.locGroupedData = [];
      this.grandTotal = 0;

      const map: { [key: string]: any[] } = {};

      this.locmosData.forEach(row => {
        if (!map[row.LOCATIONNAME]) map[row.LOCATIONNAME] = [];
        map[row.LOCATIONNAME].push(row);
      });

      Object.keys(map).forEach(loc => {
        const rows = map[loc];
        const subtotal = rows.reduce(
          (s, r) => s + Number(r.Sales_KWD || 0),
          0
        );

        this.locGroupedData.push({ location: loc, rows, subtotal });
        this.grandTotal += subtotal;
      });
    });
}

exportLOCMOS(): void {
  let locationLabel = this.selectedLocation === 'NULL' ? 'All Locations' : this.selectedLocation;
  const fileName = `${locationLabel}-monthly-sales-${this.mCurDate}.xlsx`;

  const rows: any[] = [];

  // Title row
  rows.push([{ v: 'Location-wise Monthly Sales', s: { font: { bold: true, sz: 16 } } }]);

  // Empty row
  rows.push([]);

  // Header row
  rows.push([
    { v: 'Month', s: { font: { bold: true } } },
    { v: 'Location ID', s: { font: { bold: true } } },
    { v: 'Location Name', s: { font: { bold: true } } },
    { v: 'Amount', s: { font: { bold: true } } }
  ]);

  // Data with grouping
  this.locGroupedData.forEach(group => {

    group.rows.forEach((row: any) => {
      rows.push([
        row.MonthYear,
        row.SALESUNITID,
        row.LOCATIONNAME,
        row.Sales_KWD
      ]);
    });

    // Subtotal row
    rows.push([
      '',
      '',
      `${group.location} Subtotal`,
      group.subtotal
    ]);
  });

  // Grand total
  rows.push([
    '',
    '',
    'Grand Total',
    this.grandTotal
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  const workbook: XLSX.WorkBook = {
    Sheets: { Report: worksheet },
    SheetNames: ['Report']
  };

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  FileSaver.saveAs(blob, fileName);
}

  openMOSSUM() {
    let dialogRef = this.dialog.open(this.mossumLookupDialog);
    this.mossumData = []
    this.getMOSSUM()
  }

getMOSSUM() {
  this.getData = true;

  this.reportService.getMonthwiseSalesSummary()
    .subscribe((res: any) => {

      if (!res.recordset || res.recordset.length === 0) {
        alert('No data for selected year');
        this.getData = false;
        return;
      }

      // Filter rows for selected year (if backend is multi‑year)
      this.mossumData = res.recordset.filter(
        (r: any) => Number(r.YEAR) === this.selectedYear || !r.YEAR
      );

      this.getData = false;
    },
    () => {
      this.getData = false;
      alert('Failed to load summary');
    });
}


  exportMOSSUM(): void {
    //const fileName = `monthwise-sales-summary-${this.mCurDate}.xlsx`;

    /* 1. Create worksheet from cwsoaData
    const mossumSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.mossumData.map(row => ({
      'Location': row.LOCATIONNAME,
      'January': row.January,
      'February': row.February,
      'March': row.March,
      'April': row.April,
      'May': row.May,
      'June': row.June,
      'July': row.July,
      'August': row.August,
      'September': row.September,
      'October': row.October,
      'November': row.November,
      'December': row.December,
    })));

    // 3. Create a workbook and add the sheets
    const workbook: XLSX.WorkBook = {
      Sheets: {
        'Statement': mossumSheet,
      },
      SheetNames: ['Statement']
    };

    // 4. Generate buffer
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    // 5. Save to file
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });

    FileSaver.saveAs(blob, fileName);*/
    const link = document.createElement('a');
    link.href = 'assets/reports/petzone_sales.xlsx';
    link.click();
  }


  openLWPS() {
  this.dialog.open(this.lwpsLookupDialog, {
    width: '95%',
    maxWidth: '95vw'
  });

  this.lwpsData = [];
  this.lwpsGroupedData = [];
  this.selectedLocation = 'NULL';
}
  
getLWPS() {
  if (!this.startDate || !this.endDate) {
    alert('Please select start & end date');
    return;
  }

  this.getData = true;

  const start = this.formatDate(this.startDate);
  const end = this.formatDate(this.endDate);

  this.reportService
    .getLocationwiseProfit(start, end, this.selectedLocation)
    .subscribe((res: any) => {

      console.log(res.recordset)
      if (!res.recordset || res.recordset.length === 0) {
        alert('No data for selected criteria');
        this.getData = false;
        return;
      }

      this.lwpsData = res.recordset;
      this.getData = false;

      const map: any = {};

      this.lwpsData.forEach(r => {
        if (!map[r.Location]) map[r.Location] = [];
        map[r.Location].push(r);
      });

      this.lwpsGroupedData = Object.keys(map).map(loc => {
        const rows = map[loc];

        const totalqty = rows.reduce((sum: number, x: any) => sum + Number(x.UNITQTY || 0), 0);
        const totalSales = rows.reduce((sum: number, x: any) => sum + Number(x.GrossAmount || 0), 0);
        const totalCost = rows.reduce((sum: number, x: any) => sum + Number(x.CostOfSale || 0), 0);
        const totalProfit = totalSales - totalCost;

        return {
          location: loc,
          rows,
          totalqty,
          totalSales,
          totalCost,
          totalProfit,
          margin: totalCost === 0 ? 0 : (totalProfit / totalCost) * 100
        };
      });
    });
}

exportLWPS() {
  let locationLabel = this.selectedLocation === 'NULL' ? 'All Locations' : this.selectedLocation;
  const fileName = `${locationLabel}-profit-${this.startDate}-${this.endDate}-${this.mCurDate}.xlsx`;

  const rows: any[] = [];

  // Title
  rows.push([`Location-wise Profit Statement`]);
  rows.push([`Location: ${locationLabel}`]);
  rows.push([`Period: ${this.startDate} to ${this.endDate}`]);
  rows.push([]);

  // Header
  rows.push([
    'Voucher No',
    'Date',
    'Customer ID',
    'Customer Name',
    'Product ID',
    'Product Name',
    'Product/Service',
    'Brand',
    'Category',
    'Supplier',
    'Qty',
    'Unit',
    'Unit Price',
    'Discount',
    'Net Sales',
    'Unit Cost',
    'Net Cost',
    'Profit',
    'Margin %'
  ]);

  // Data
  this.lwpsGroupedData.forEach(group => {

    // Optional: Location header row
    rows.push([`${group.location}`]);
    
    group.rows.forEach((r: any) => {
      rows.push([
        r.VoucherNo,
        this.formatExcelDate(r.VoucherDate),
        r.CustomerID,
        r.CustomerName,
        r.ProductID,
        r.ProductName,
        this.getProductType(r.ProductID),
        r.Brand,
        r.Category,
        r.Supplier,
        r.Quantity,
        r.Unit,
        r.UnitPrice,
        this.calcDiff(r),
        r.GrossAmount,
        r.UnitCost,
        r.CostOfSale,
        r.GrossProfit,
        r.ProfitMarginPercent
      ]);
    });

    // Subtotal row
    rows.push([
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      `${group.location} Subtotal`,
      group.totalqty,
      '',
      '',
      '',
      group.totalSales,
      '',
      group.totalCost,
      group.totalProfit,
      group.margin
    ]);

    // Spacer row
    rows.push([]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  worksheet['!cols'] = [
    { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 25 },
    { wch: 15 }, { wch: 35 }, { wch: 20 }, { wch: 25 }, 
    { wch: 35 }, { wch: 25 }, { wch: 10 }, { wch: 10 }, 
    { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
    { wch: 15 }, { wch: 15 }, { wch: 15 }
  ];

  // Number formatting
  const range = XLSX.utils.decode_range(worksheet['!ref']!);
  for (let R = 0; R <= range.e.r; ++R) {
    [9, 11, 12, 13, 14, 15, 16, 17].forEach(col => {
      const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: col })];
      if (cell && typeof cell.v === 'number') {
        cell.z = '#,##0.000';
      }
    });
  }

  const workbook: XLSX.WorkBook = {
    Sheets: { Statement: worksheet },
    SheetNames: ['Statement']
  };

  const buffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
  });

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  FileSaver.saveAs(blob, fileName);
}

formatExcelDate(date: any): string {
  if (!date) return '';

  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}-${month}-${year}`; // or yyyy-mm-dd if you prefer
}

getProductType(productId: any): string {
  const id = Number(productId);
  if (!isFinite(id)) return '';

  return id < 1000 ? 'Service' : 'Product';
}

  searchCustomer(search: string) {
    this.reportService.searchCustomer(search).subscribe((res: any) => {
      this.customerList = res.recordset
    }, (err: any) => {
      console.log(err)
    })
  }

  selectCustomer(custId: string) {
    this.selectedCustomer = custId
  }

  formatDate(date: any) {
    var d = new Date(date), day = '' + d.getDate(), month = '' + (d.getMonth() + 1), year = d.getFullYear();

    if (day.length < 2) {
      day = '0' + day;
    } 
    if (month.length < 2) {
      month = '0' + month;
    }
    return [year, month, day].join('-');
  }

calcDiff(r: any): number {
  const v =
    (Number(r.UNITQTY) * Number(r.UnitPrice)) -
    Number(r.GROSSAMOUNT);

  if (!isFinite(v)) return 0;

  // ✅ Clamp tiny floating values
  if (Math.abs(v) > 0 && Math.abs(v) < 0.001) {
    return v > 0 ? 0.001 : -0.001;
  }

  return v;
}
}