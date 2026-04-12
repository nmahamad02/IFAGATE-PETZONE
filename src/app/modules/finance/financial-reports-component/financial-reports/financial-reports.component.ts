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
  @ViewChild('iwpdpfLookupDialog', { static: false }) iwpdpfLookupDialog!: TemplateRef<any>;
  @ViewChild('lwpsLookupDialog', { static: false }) lwpsLookupDialog!: TemplateRef<any>;

  currentYear = new Date().getFullYear()
  mCurDate = this.formatDate(new Date())

  yearList: number[] = [];
  selectedYear: number = new Date().getFullYear();

  locmosData: any[] = []
  locGroupedData: { location: string, rows: any[], subtotal: number }[] = [];
  mossumData: any[] = []
  iwpdpfData: any[] = []
  lwpsData: any[] = [];
  lwpsGroupedData: any[] = [];


  groupedData: any[] = [];
  grandTotal: number = 0;

  locationList: any[] = [];
  customerList: any[] = [];

  selectedLocation: string = 'NULL'
  selectedCustomer: string = 'NULL'

  startDate: Date;
  endDate: Date;

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

  printLOCMOS() {
    var doc = new jsPDF("portrait", "px", "a4");
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Location-wise Monthly Sales Statement', 150, 20);
    doc.roundedRect(5, 32.5, 436, 55, 5, 5);
    doc.setFontSize(10);
    let locationLabel = this.selectedLocation === 'NULL' ? 'All Locations' : this.selectedLocation;
    doc.text(`${locationLabel}`, 10, 42);    
    doc.setFont('Helvetica', 'normal');
    doc.text(`Date: ${this.mCurDate}`,330,42);
    let firstPageStartY = 55; // Start Y position for first page
    let nextPagesStartY = 35; // Start Y position for subsequent pages
    let firstPage = true;      // Flag to check if it's the first page

    autoTable(doc, {
      html: '#locMosTable',
      tableWidth: 435,
      theme: 'grid', // Changed from 'striped' to 'grid' for clean borders
      styles: {
        fontSize: 8,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        halign: 'left',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [255, 255, 255], // White background
        textColor: [0, 0, 0],       // Black text
        fontStyle: 'bold',
        halign: 'left'
      },
      footStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'right'
      },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right' },
        9: { halign: 'right' },
        10: { halign: 'right' },
        11: { halign: 'right' },
        12: { halign: 'right' }
      },
      margin: { 
        top: firstPage ? firstPageStartY : nextPagesStartY,
        left: 5
      },
      showFoot: 'lastPage', 
      didDrawPage: function () {
        firstPage = false;
      }
    });

    let finalY1 = doc.lastAutoTable?.finalY || 0
  
    // Bilingual footer text
    doc.setFontSize(8);
    // Now the font is already registered thanks to the JS file!
    //doc.addFileToVFS('Amiri-Regular-normal.ttf', this.myFont);
    //doc.addFont('Amiri-Regular-normal.ttf', 'Amiri-Regular', 'normal');        
    // Manually reverse Arabic for basic rendering
    //const araText = ":تصدر الشيكات بإسم\n شركة سوق بت زون المركزي لغير المواد الغذائية";
    //const engText = "Kindly issue cheques in the name of: \nPetzone Central Market company For Non Food Items W.L.L";
    const pageWidth = doc.internal.pageSize.getWidth();
    // Calculate X to center
    const centerX = pageWidth / 2;
    doc.setFontSize(10)
    //doc.text(engText, 10, finalY1+15);//, { align: 'center' });
    //doc.setFont('Amiri-Regular', 'normal')
    //doc.text(araText, 435, finalY1+15, { align: 'right' });

    // Add watermark (if necessary)
    doc = this.addWaterMark(doc,'p');
    // Save the PDF
    doc.save(`${locationLabel}-monthly-sales-${this.mCurDate}.pdf`);
  }

  exportLOCMOS(): void {
    console.log(this.locmosData)
    let locationLabel = this.selectedLocation === 'NULL' ? 'All Locations' : this.selectedLocation;
    const fileName = `${locationLabel}-monthly-sales-${this.mCurDate}.xlsx`;

    // 1. Create worksheet from cwsoaData
    const locmosSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.locmosData.map(row => ({
      'Month': row.MonthYear,
      'Location ID': row.SALESUNITID,
      'Location Name': row.LOCATIONNAME,
      'Sales (KWD)': row.Sales_KWD,
    })));

    // 3. Create a workbook and add the sheets
    const workbook: XLSX.WorkBook = {
      Sheets: {
        'Statement': locmosSheet,
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

  printMOSSUM() {
    var doc = new jsPDF("landscape", "px", "a4");
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Month-wise Sales Statement', 200, 20);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Date: ${this.mCurDate}`,550,20);
    let firstPageStartY = 35; // Start Y position for first page
    let nextPagesStartY = 35; // Start Y position for subsequent pages
    let firstPage = true;      // Flag to check if it's the first page

    autoTable(doc, {
      html: '#mosSumTable',
      tableWidth: 620,
      theme: 'grid', // Changed from 'striped' to 'grid' for clean borders
      styles: {
        fontSize: 8,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        halign: 'left',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [255, 255, 255], // White background
        textColor: [0, 0, 0],       // Black text
        fontStyle: 'bold',
        halign: 'left'
      },
      footStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'right'
      },
      columnStyles: {
        3: { halign: 'right' }
      },
      margin: { 
        top: firstPage ? firstPageStartY : nextPagesStartY,
        left: 5
      },
      showFoot: 'lastPage', 
      didDrawPage: function () {
        firstPage = false;
      }
    });

    let finalY1 = doc.lastAutoTable?.finalY || 0
  
    // Bilingual footer text
    doc.setFontSize(8);
    // Now the font is already registered thanks to the JS file!
    //doc.addFileToVFS('Amiri-Regular-normal.ttf', this.myFont);
    //doc.addFont('Amiri-Regular-normal.ttf', 'Amiri-Regular', 'normal');        
    // Manually reverse Arabic for basic rendering
    //const araText = ":تصدر الشيكات بإسم\n شركة سوق بت زون المركزي لغير المواد الغذائية";
    //const engText = "Kindly issue cheques in the name of: \nPetzone Central Market company For Non Food Items W.L.L";
    const pageWidth = doc.internal.pageSize.getWidth();
    // Calculate X to center
    const centerX = pageWidth / 2;
    doc.setFontSize(10)
    //doc.text(engText, 10, finalY1+15);//, { align: 'center' });
    //doc.setFont('Amiri-Regular', 'normal')
    //doc.text(araText, 435, finalY1+15, { align: 'right' });

    // Add watermark (if necessary)
    doc = this.addWaterMark(doc,'l');
    // Save the PDF
    doc.save(`monthwise-sales-summary-${this.mCurDate}.pdf`);
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

  openIWPDPF() {
    let dialogRef = this.dialog.open(this.iwpdpfLookupDialog);
    this.iwpdpfData = []
    this.groupedData = []
    //this.searchText = ''
    this.selectedCustomer = 'NULL'
    this.selectedLocation = 'NULL'
  }

  getIWPDPF() {
    if (!this.startDate || !this.endDate) {
      alert('Please select both start and end dates.');
      return;
    }
    const start = new Date(this.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(this.endDate);
    end.setHours(23, 59, 59, 999);  
        this.getData = true
    this.reportService.getItemwisePeriodSales(this.formatDate(start),this.formatDate(end),this.selectedLocation,this.selectedCustomer).subscribe((res: any) => {
      if (res.recordset.length === 0) {
        alert('No data for the selected parameters!');
              this.getData = false
        return;
      }
      this.iwpdpfData = res.recordset;
          this.getData = false
      console.log(this.iwpdpfData);
      // Reset
      this.groupedData = [];
      this.grandTotal = 0;
      // Group by DocNumber + CustomerID + CustomerName (and add Transaction if exists)
      const tempGroup: { [key: string]: any[] } = {};
      this.iwpdpfData.forEach((row: any) => {
        const key = `${row.DOCNUMBER}|${row.CUSTOMERID}|${row.CUSTOMERNAME}`;
        if (!tempGroup[key]) tempGroup[key] = [];
        tempGroup[key].push(row);
      });
      // Convert to array with subtotal
      for (const key of Object.keys(tempGroup)) {
        const rows = tempGroup[key];
        const totalSale = rows.reduce((sum, r) => sum + Number(r.GROSSAMOUNT || 0), 0);
        const totalCost = rows.reduce((sum, r) => sum + Number(r.CostOfSale || 0), 0);
        const [doc, custId, custName] = key.split("|");
        this.groupedData.push({
          docNumber: doc,
          customerId: custId,
          customerName: custName,
          rows,
          totalSale,
          totalCost,
        });
        this.grandTotal += totalSale;
      }
      // Optional: sort by doc number or customer
      this.groupedData.sort((a, b) => a.docNumber.localeCompare(b.docNumber));
    }, (err: any) => {
      console.log(err);
    });
  }

  printIWPDPF() {
    var doc = new jsPDF("landscape", "px", "a4");
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Customer-wise Period Profit Statement', 200, 20);
    doc.roundedRect(5, 32.5, 620, 55, 5, 5);
    doc.setFontSize(10);
    let customerLabel = this.selectedCustomer === 'NULL' ? 'All Customers' : this.selectedCustomer;
    doc.text(`${customerLabel}`, 10, 42);
    let locationLabel = this.selectedLocation === 'NULL' ? 'All Locations' : this.selectedLocation;
    doc.text(`${locationLabel}`, 10, 52);    
    doc.setFont('Helvetica', 'normal');
    doc.text(`Date: ${this.mCurDate}`,550,42);
    let firstPageStartY = 60; // Start Y position for first page
    let nextPagesStartY = 35; // Start Y position for subsequent pages
    let firstPage = true;      // Flag to check if it's the first page

    autoTable(doc, {
      html: '#iwpdpfTable',
      tableWidth: 620,
      theme: 'grid', // Changed from 'striped' to 'grid' for clean borders
      styles: {
        fontSize: 8,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        halign: 'left',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [255, 255, 255], // White background
        textColor: [0, 0, 0],       // Black text
        fontStyle: 'bold',
        halign: 'left'
      },
      footStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'right'
      },
      columnStyles: {
        10: { halign: 'right' },
        11: { halign: 'right' },
        12: { halign: 'right' },
        13: { halign: 'right' },
        14: { halign: 'right' },
        15: { halign: 'right' },
        16: { halign: 'right' },
      },
      margin: { 
        top: firstPage ? firstPageStartY : nextPagesStartY,
        left: 5
      },
      showFoot: 'lastPage', 
      didDrawPage: function () {
        firstPage = false;
      }
    });

    let finalY1 = doc.lastAutoTable?.finalY || 0
  
    // Bilingual footer text
    doc.setFontSize(8);
    // Now the font is already registered thanks to the JS file!
    //doc.addFileToVFS('Amiri-Regular-normal.ttf', this.myFont);
    //doc.addFont('Amiri-Regular-normal.ttf', 'Amiri-Regular', 'normal');        
    // Manually reverse Arabic for basic rendering
    //const araText = ":تصدر الشيكات بإسم\n شركة سوق بت زون المركزي لغير المواد الغذائية";
    //const engText = "Kindly issue cheques in the name of: \nPetzone Central Market company For Non Food Items W.L.L";
    const pageWidth = doc.internal.pageSize.getWidth();
    // Calculate X to center
    const centerX = pageWidth / 2;
    doc.setFontSize(10)
    //doc.text(engText, 10, finalY1+15);//, { align: 'center' });
    //doc.setFont('Amiri-Regular', 'normal')
    //doc.text(araText, 435, finalY1+15, { align: 'right' });

    // Add watermark (if necessary)
    doc = this.addWaterMark(doc,'l');
    // Save the PDF
    doc.save(`${customerLabel}-${locationLabel}-profit-${this.startDate}-${this.endDate}-${this.mCurDate}.pdf`);
  }

  exportIWPDPF(): void {
    
    let customerLabel = this.selectedCustomer === 'NULL' ? 'All Customers' : this.selectedCustomer;
    let locationLabel = this.selectedLocation === 'NULL' ? 'All Locations' : this.selectedLocation;
    const fileName = `${customerLabel}-${locationLabel}-profit-${this.startDate}-${this.endDate}-${this.mCurDate}.xlsx`;

    // 1. Create worksheet from cwsoaData
    const iwpdpfSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.iwpdpfData.map(row => ({
      'Voucher Number': row.DOCNUMBER,
      'Date': row.DOCDATE,
      'Customer ID': row.CUSTOMERID,
      'Customer Name': row.CUSTOMERNAME,
      'Location': row.LOCATIONNAME,
      'Product ID': row.PRODUCTID,
      'Product Name': row.material_name,
      'Brand': row.brand,
      'Supplier': row.supplier,
      'Unit': 'ZPC',
      'Quantity': row.UNITQTY,
      'Unit Cost': row.COSTAMOUNT,
      'Unit Price': row.UnitPrice,
      'Cost of Sale': row.CostOfSale,
      'Gross Amount': row.GROSSAMOUNT,
      'Gross Profit': row.GrossProfit,
      'Profit Margin': row.ProfitPercent,
    })));

    // 3. Create a workbook and add the sheets
    const workbook: XLSX.WorkBook = {
      Sheets: {
        'Statement': iwpdpfSheet,
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

    FileSaver.saveAs(blob, fileName);
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

        const totalSales = rows.reduce((sum: number, x: any) => sum + Number(x.GrossAmount || 0), 0);
        const totalCost = rows.reduce((sum: number, x: any) => sum + Number(x.CostOfSale || 0), 0);
        const totalProfit = totalSales - totalCost;

        return {
          location: loc,
          rows,
          totalSales,
          totalCost,
          totalProfit,
          margin: totalCost === 0 ? 0 : (totalProfit / totalCost) * 100
        };
      });
    });
}

printLWPS() {
    var doc = new jsPDF("landscape", "px", "a4");
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Location-wise Period Profit Statement', 200, 20);
    doc.roundedRect(5, 32.5, 620, 55, 5, 5);
    doc.setFontSize(10);
    let locationLabel = this.selectedLocation === 'NULL' ? 'All Locations' : this.selectedLocation;
    doc.text(`${locationLabel}`, 10, 42);    
    doc.setFont('Helvetica', 'normal');
    doc.text(`Date: ${this.mCurDate}`,550,42);
    let firstPageStartY = 60; // Start Y position for first page
    let nextPagesStartY = 35; // Start Y position for subsequent pages
    let firstPage = true;      // Flag to check if it's the first page

    autoTable(doc, {
      html: '#lwpsTable',
      tableWidth: 620,
      theme: 'grid', // Changed from 'striped' to 'grid' for clean borders
      styles: {
        fontSize: 8,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        halign: 'left',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [255, 255, 255], // White background
        textColor: [0, 0, 0],       // Black text
        fontStyle: 'bold',
        halign: 'left'
      },
      footStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'right'
      },
      columnStyles: {
        10: { halign: 'right' },
        11: { halign: 'right' },
        12: { halign: 'right' },
        13: { halign: 'right' },
        14: { halign: 'right' },
        15: { halign: 'right' },
        16: { halign: 'right' },
      },
      margin: { 
        top: firstPage ? firstPageStartY : nextPagesStartY,
        left: 5
      },
      showFoot: 'lastPage', 
      didDrawPage: function () {
        firstPage = false;
      }
    });

    let finalY1 = doc.lastAutoTable?.finalY || 0
  
    // Bilingual footer text
    doc.setFontSize(8);
    // Now the font is already registered thanks to the JS file!
    //doc.addFileToVFS('Amiri-Regular-normal.ttf', this.myFont);
    //doc.addFont('Amiri-Regular-normal.ttf', 'Amiri-Regular', 'normal');        
    // Manually reverse Arabic for basic rendering
    //const araText = ":تصدر الشيكات بإسم\n شركة سوق بت زون المركزي لغير المواد الغذائية";
    //const engText = "Kindly issue cheques in the name of: \nPetzone Central Market company For Non Food Items W.L.L";
    const pageWidth = doc.internal.pageSize.getWidth();
    // Calculate X to center
    const centerX = pageWidth / 2;
    doc.setFontSize(10)
    //doc.text(engText, 10, finalY1+15);//, { align: 'center' });
    //doc.setFont('Amiri-Regular', 'normal')
    //doc.text(araText, 435, finalY1+15, { align: 'right' });

    // Add watermark (if necessary)
    doc = this.addWaterMark(doc,'l');

  doc.save(
    `${locationLabel}-profit-${this.startDate}-${this.endDate}.pdf`
  );
}

exportLWPS() {
      let locationLabel = this.selectedLocation === 'NULL' ? 'All Locations' : this.selectedLocation;
  const fileName = `${locationLabel}-profit-${this.startDate}-${this.endDate}-${this.mCurDate}.xlsx`;
  const sheet = XLSX.utils.json_to_sheet(
    this.lwpsData.map(r => ({
      Voucher: r.VoucherNo,
      Date: r.VoucherDate,
      CustomerID: r.CustomerID,
      CustomerName: r.CustomerName,
      Location: r.Location,
      ProductID: r.ProductID,
      ProductName: r.ProductName,
      Brand: r.Brand,
      Supplier: r.Supplier,
      Unit: r.Unit,
      Quantity: r.Quantity,
      UnitCost: r.UnitCost,
      UnitPrice: r.UnitPrice,
      CostOfSale: r.CostOfSale,
      GrossAmount: r.GrossAmount,
      GrossProfit: r.GrossProfit,
      ProfitPercent: r.ProfitMarginPercent
    }))
  );

  const wb: XLSX.WorkBook = {
    Sheets: { Statement: sheet },
    SheetNames: ['Statement']
  };

  const buffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array'
  });

    // 5. Save to file
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });

    FileSaver.saveAs(blob, fileName);
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

calculateAgeing(data: any[]): any {
  const ageing = {
    CURRENT: 0,
    '30_DAYS': 0,
    '60_DAYS': 0,
    '90_DAYS': 0,
    '120_DAYS': 0,
    ABOVE_120_DAYS: 0,
  };

  for (const row of data) {
    const debit = Number(row.DEBIT) || 0;
    const credit = Number(row.CREDIT) || 0;
    const amt = debit - credit;
    const diff = row.DAYS_DIFF;

      if (diff < 0) ageing.CURRENT += amt;
      else if (diff <= 30) ageing['30_DAYS'] += amt;
      else if (diff <= 60) ageing['60_DAYS'] += amt;
      else if (diff <= 90) ageing['90_DAYS'] += amt;
      else if (diff <= 120) ageing['120_DAYS'] += amt;
      else ageing.ABOVE_120_DAYS += amt;
    
  }

  return ageing;
}

  addWaterMark(doc: any,type: string) {
    if (type === 'l') {
      var totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setLineWidth(0.25)
        var img1 = new Image()
        img1.src = 'assets/pics/Logo-removebg-preview.png'
        doc.addImage(img1, 'png', 5, 0, 75, 30);
        doc.setTextColor(0,0,0);
        doc.setFontSize(13)
        doc.line(5, 27, 625, 27); 
        doc.setTextColor(0,0,0);
        doc.setFontSize(10)
        doc.setFont('Helvetica','bold');
        var img2 = new Image()
        img2.src = 'assets/pics/favicon.png';
        doc.addImage(img2, 'png', 2, 575, 10, 10);
        doc.text('IFAGATE',12.5, 582.5);
        doc.setFont('Helvetica','normal');
        doc.setFontSize(8);
        doc.setFont('Helvetica','normal');
        doc.text(`Page ${i} of ${totalPages}`,550,580);
      }
      return doc;
    } else if (type === 'p') {
      var totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setLineWidth(0.25)
        var img1 = new Image()
        img1.src = 'assets/pics/Logo-removebg-preview.png'
        doc.addImage(img1, 'png', 5, 0, 75, 30);
        doc.setTextColor(0,0,0);
        doc.setFontSize(13)
        doc.line(5, 27, 441, 27); 
        doc.setTextColor(0,0,0);
        doc.setFontSize(10)
        doc.setFont('Helvetica','bold');
        var img2 = new Image()
        img2.src = 'assets/pics/favicon.png';
        doc.addImage(img2, 'png', 2, 615, 10, 10);
        doc.text('IFAGATE',12.5,622.5);
        doc.setFont('Helvetica','normal');
        doc.setFontSize(8);
        doc.setFont('Helvetica','normal');
        doc.text(`Page ${i} of ${totalPages}`,400,620);
      }
      return doc;
    }
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
}