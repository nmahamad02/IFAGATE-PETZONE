
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AccountsService } from 'src/app/services/accounts/accounts.service';
import { ReportsService } from 'src/app/services/reports/reports.service';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { firstValueFrom } from 'rxjs';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY?: number;
    };
  }
}
@Component({
  selector: 'app-soa',
  templateUrl: './soa.component.html',
  styleUrls: ['./soa.component.scss']
})
export class SoaComponent {

  /* ---------------------------------- USER ---------------------------------- */

  userRight = localStorage.getItem('userright')!;
  loggedInUser = this.removeQuotes(localStorage.getItem('firstname')) + ' ' + this.removeQuotes(localStorage.getItem('lastname'));

  /* --------------------------------- DIALOGS -------------------------------- */

  @ViewChild('swsoaLookupDialog', { static: false }) swsoaLookupDialog!: TemplateRef<any>;
  @ViewChild('spwsoaLookupDialog', { static: false }) spwsoaLookupDialog!: TemplateRef<any>;
  @ViewChild('ipwsoaLookupDialog', { static: false }) ipwsoaLookupDialog!: TemplateRef<any>;
  @ViewChild('swoutLookupDialog', { static: false }) swoutLookupDialog!: TemplateRef<any>;
  @ViewChild('iwoutLookupDialog', { static: false }) iwoutLookupDialog!: TemplateRef<any>;
  @ViewChild('swtrnlistLookupDialog', { static: false }) swtrnlistLookupDialog!: TemplateRef<any>;
  @ViewChild('spwtrnlistLookupDialog', { static: false }) spwtrnlistLookupDialog!: TemplateRef<any>;
  @ViewChild('swtrnsumLookupDialog', { static: false }) swtrnsumLookupDialog!: TemplateRef<any>;
  @ViewChild('iwtrnlistLookupDialog', { static: false }) iwtrnlistLookupDialog!: TemplateRef<any>;
  @ViewChild('ipwtrnlistLookupDialog', { static: false }) ipwtrnlistLookupDialog!: TemplateRef<any>;
  @ViewChild('iwtrnsumLookupDialog', { static: false }) iwtrnsumLookupDialog!: TemplateRef<any>;


  /* ---------------------------------- DATES --------------------------------- */

  currentYear = new Date().getFullYear();
  mCurDate = this.formatDate(new Date());
  startDate!: Date;
  endDate!: Date;


  /* ---------------------------------- DATA ---------------------------------- */

  supplierList: any[] = [];
  intermediariesList: any[] = [];
  natureList: any[] = [];
  categoryList: any[] = [];

  openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
  periodTotalDebit = 0;
  periodTotalCredit = 0;

  selectedSupplier: any;
  selectedNature: string = '';
  selectedCategory: string = '';

  searchText = '';
  getData = false;

  swsoaData: any[] = []
  spwsoaData: any[] = []
  ipwsoaData: any[] = []
  swoutData: any[] = []
  iwoutData: any[] = []
  swtrnlistData: any[] = []
  spwtrnlistData: any[] = []
  swtrnsumData: any[] = []
  iwtrnlistData: any[] = []
  ipwtrnlistData: any[] = []
  iwtrnsumData: any[] = []

  /* ---------------------------------- TOTALS -------------------------------- */

  totalOutstanding = 0;

  ageingSummary = {
    CURRENT: 0,
    '30_DAYS': 0,
    '60_DAYS': 0,
    '90_DAYS': 0,
    'ABOVE_120_DAYS': 0
  };

  /* ------------------------------ SALES UNITS ------------------------------- */

  salesUnits: { id: string; name: string; code: string; country: string }[] = [];
  selectedUnit!: { id: string; name: string; code: string; country: string };
  selectedCountryCode = 'un';

  /* -------------------------------- SERVICES -------------------------------- */

  constructor(private dialog: MatDialog, private accountService: AccountsService, private reportService: ReportsService) {
    this.loadMasters();
  }

  loadSuppliers() {
    this.getData = true;
    this.accountService.listOpbal(this.currentYear.toString(),'S').subscribe((res: any) => {
      this.getData = false;
      console.log(res.recordset)
      this.supplierList = res.recordset;
    }, (err:any) => {
      this.getData = false;
      alert('Failed to load suppliers!');
    });
  }
/*
async applySupplierFilters() {

  this.getData = true;
  this.swoutData = [];
  this.totalOutstanding = 0;

  const filtered = this.supplierList.filter(supplier => {
    const matchesSearch = this.searchText
      ? supplier.CUST_NAME.toLowerCase().includes(this.searchText.toLowerCase())
      : true;

    const matchesNature = this.selectedNature
      ? supplier.Nature === this.selectedNature
      : true;

    const matchesCategory = this.selectedCategory
      ? supplier.SupplierCategory === this.selectedCategory
      : true;

    return matchesSearch && matchesNature && matchesCategory;
  });

  // 🔹 Run ALL outstanding calls in parallel
  const results = await Promise.all(
    filtered.map(async supplier => {
      
      //const outstanding = await this.computeOutstanding(supplier.PCODE, this.endDate ? new Date(this.endDate) : new Date(), 'S');
      
      return {
        ...supplier,
        //CURRENT_OUTSTANDING: outstanding
      };
    })
  );

  // 🔹 Now assign everything at once
  this.swoutData = results;

  this.totalOutstanding = results.reduce((sum, s) => {
    return sum + (Number(s.CURRENT_OUTSTANDING) || 0);
  }, 0);

  this.getData = false;
}

async computeOutstanding(
  supplierCode: string,
  asOfDate: Date,
  type: string
): Promise<number> {
  try {

    const res: any = await firstValueFrom(
      this.reportService.getApCustomerSoa(this.selectedUnit.id, type, supplierCode)
    );

    const end = new Date(asOfDate);
    end.setHours(23, 59, 59, 999);

    const txns = (res.recordset || []).filter((row: any) => {
      if (!row.INV_DATE) return false;
      return new Date(row.INV_DATE) <= end;
    });

    if (!txns.length) return 0;

    let balance = 0;

    for (const row of txns) {
      const credit = Number((row.CREDIT ?? 0).toString().replace(/,/g, '')) || 0;
      const debit  = Number((row.DEBIT ?? 0).toString().replace(/,/g, '')) || 0;

      balance += credit;
      balance -= debit;
    }

    return balance;

  } catch (err) {
    console.error('Failed to fetch SOA for supplier:', supplierCode, err);
    return 0;
  }
}
*/
loadIntermedaries() {
    this.getData = true;
    this.accountService.listOpbal(this.currentYear.toString(),'G').subscribe((res: any) => {
      this.getData = false;
      console.log(res.recordset)
      this.intermediariesList = res.recordset;
    }, (err:any) => {
      this.getData = false;
      alert('Failed to load suppliers!');
    });
  }
/*
async applyIntermediaryFilters() {

  this.getData = true;
  this.iwoutData = [];
  this.totalOutstanding = 0;

  const filtered = this.intermediariesList.filter(supplier => {
    const matchesSearch = this.searchText
      ? supplier.CUST_NAME.toLowerCase().includes(this.searchText.toLowerCase())
      : true;

    return matchesSearch;
  });

  // 🔹 Run ALL outstanding calls in parallel
  const results = await Promise.all(
    filtered.map(async supplier => {
      
      const outstanding = await this.computeOutstanding(supplier.PCODE, this.endDate ? new Date(this.endDate) : new Date(),'G');
      
      return {
        ...supplier,
        CURRENT_OUTSTANDING: outstanding
      };
    })
  );

  // 🔹 Now assign everything at once
  this.iwoutData = results;

  this.totalOutstanding = results.reduce((sum, s) => {
    return sum + (Number(s.CURRENT_OUTSTANDING) || 0);
  }, 0);

  this.getData = false;
}*/

  ngOnInit() {
    this.loadSalesUnits();
  }

  loadMasters() {
    this.accountService.listOpbal(this.currentYear.toString(), 'S')
      .subscribe((res: any) => this.supplierList = res.recordset || []);

    this.accountService.listOpbal(this.currentYear.toString(), 'G')
      .subscribe((res: any) => this.intermediariesList = res.recordset || []);

    this.reportService.getSupplierNatureList().subscribe((res: any) => {
      console.log(res)
      this.natureList = res.recordset;
    }, (error: any) => {
      console.log(error);
    });

    this.reportService.getSupplierCategoryList().subscribe((res: any) => {
      console.log(res)
      this.categoryList = res.recordset;
    }, (error: any) => {
      console.log(error);
    });
  }

  loadSalesUnits() {
    this.reportService.getSalesUnits().subscribe((res: any) => {
      const data = res.recordset || [];
      this.salesUnits = [
        { id: '*', name: 'All Units', code: 'un', country: 'un' },
        ...data.map((u: any) => ({
          id: u.salesunitID,
          name: u.salesunitname,
          code: this.mapFlagCode(u.salesunitname),
          country: this.mapCountry(u.salesunitname)
        }))
      ];

 this.selectedUnit = this.salesUnits[0];
    });
  }

  updateUnit(unit: any) {
    this.selectedUnit = unit;
    this.selectedCountryCode = unit.code;
  }

  /* ------------------------------ SUPPLIER SOA ------------------------------- */

  openSWSOA() {
    this.dialog.open(this.swsoaLookupDialog, {
      width: '100vw',
      maxWidth: '100vw'
    });
    this.resetSOA();
  }

getSWSOA(customer: any) {
  this.selectedSupplier = customer;
  this.getData = true;
  this.resetSOA();

  this.reportService
    .getSupplierSOA(this.selectedUnit.id, customer.PCODE)
    .subscribe({
      next: (res: any) => {
        this.getData = false;

        const rows = res.recordsets?.[0] || [];

        let running = 0;
        this.swsoaData = rows.map((r: any) => {
          running += r.BALANCE; // +invoice, -receipt
          return {
            ...r,
            RUNNING_BALANCE: running
          };
        });

        this.processSupplierSOA(this.swsoaData);
      },
      error: () => {
        this.getData = false;
        alert('Failed to load Supplier SOA');
      }
    });
}

  printSWSOA() {
    var doc = new jsPDF("portrait", "px", "a4");
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Statement of Account', 160, 20);
    doc.roundedRect(5, 32.5, 436, 55, 5, 5);
    doc.setFontSize(10);
    doc.text(`${this.selectedSupplier.CUST_NAME}`,10,42);
    doc.text(`Account ID: ${this.selectedSupplier.PCODE}`,330,42);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Date: ${this.mCurDate}`,330,52);
    doc.text('Nature',10,52);
    doc.text(`: ${this.selectedSupplier.Nature}`,45,52);
    doc.text('Category',10,62);
    doc.text(`: ${this.selectedSupplier.SupplierCategory}`,45,62);
    let firstPageStartY = 70; // Start Y position for first page
    let nextPagesStartY = 35; // Start Y position for subsequent pages
    let firstPage = true;      // Flag to check if it's the first page

    autoTable(doc, {
      html: '#swSoaTable',
      tableWidth: 436,
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
      /*columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' }
      },*/
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
    autoTable(doc, {
      html: '#swsoaAgeingSummaryTable',
      startY: finalY1 + 5,
      tableWidth: 436,
      margin: { left: 5 },
      theme: 'grid',
      styles: {
        fontSize: 8,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        halign: 'center'
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      /*columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' }
      }*/
    });

    // Add watermark (if necessary)
    doc = this.addWaterMark(doc,'p');
    // Save the PDF
    doc.save(`${this.selectedSupplier.PCODE}-statement-of-accounts-${this.mCurDate}.pdf`);
  }

 /* --------------------------- PERIOD SUPPLIER SOA --------------------------- */

  openSPWSOA() {
    this.dialog.open(this.spwsoaLookupDialog, {
      width: '100vw',
      maxWidth: '100vw'
    });
    this.resetSOA();
  }


getSPWSOA(customer: any) {
  this.selectedSupplier = customer;
  this.getData = true;
  this.resetSOA();
}
  
  setSPWSOA() {
    if (!this.selectedSupplier || !this.startDate || !this.endDate) {
      alert('Please select supplier and date range');
      return;
    }

    this.reportService
      .getSupplierSOA(this.selectedUnit.id, this.selectedSupplier.PCODE)
      .subscribe({
        next: (res: any) => {
          this.getData = false;
          const rows = (res.recordsets?.[0] || []).filter((r: any) => {
            const d = new Date(r.INV_DATE);
            return d >= this.startDate && d <= this.endDate;
          });
          this.processSupplierSOA({ recordsets: [rows] });
          this.spwsoaData = rows;
        },
        error: () => {
          this.getData = false;
          alert('Failed to load Period Supplier SOA');
        }
    });
  }

    printSPWSOA() {
    if (!this.startDate || !this.endDate) {
      alert('Please select both start and end dates.');
      return;
    } else {
    var doc = new jsPDF("portrait", "px", "a4");
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Statement of Account', 160, 20);
    doc.roundedRect(5, 32.5, 436, 65, 5, 5);
    doc.setFontSize(10);
    doc.text(`${this.selectedSupplier.CUST_NAME}`,10,42);
    doc.text(`Account ID: ${this.selectedSupplier.PCODE}`,330,42);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Date: ${this.mCurDate}`,330,52);
    doc.text('Nature',10,52);
    doc.text(`: ${this.selectedSupplier.Nature}`,45,52);
    doc.text('Category',10,62);
    doc.text(`: ${this.selectedSupplier.SupplierCategory}`,45,62);
    doc.text('Period',10,72);
    doc.text(`: ${this.formatDate(this.startDate)} - ${this.formatDate(this.endDate)}`, 45, 72)
    let firstPageStartY = 80; // Start Y position for first page
    let nextPagesStartY = 35; // Start Y position for subsequent pages
    let firstPage = true;      // Flag to check if it's the first page

    autoTable(doc, {
      html: '#spwSoaTable',
      tableWidth: 436,
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
    /*  columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' }
      },*/
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

    autoTable(doc, {
      html: '#spwsoaAgeingSummaryTable',
      startY: finalY1 + 5,
      tableWidth: 436,
      margin: { left: 5 },
      theme: 'grid',
      styles: {
        fontSize: 8,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        halign: 'center'
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
     /* columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' }
      }*/
    });
 
    // Add watermark (if necessary)
    doc = this.addWaterMark(doc,'p');
    // Save the PDF
    doc.save(`${this.selectedSupplier.PCODE}-statement-of-accounts-${this.mCurDate}-period-${this.startDate}-${this.endDate}.pdf`);
    }
  }

/* ---------------------------- INTERMEDIARY SOA ----------------------------- */

  openIPWSOA() {
    this.dialog.open(this.ipwsoaLookupDialog, {
      width: '100vw',
      maxWidth: '100vw'
    });
    this.resetSOA();
  }

  setIPWSOA() {
    if (!this.selectedSupplier || !this.startDate || !this.endDate) {
      alert('Please select intermediary and date range');
      return;
    }

    this.getData = true;
    this.resetSOA();

 this.reportService
      .getSupplierSOA(this.selectedUnit.id, this.selectedSupplier.PCODE)
      .subscribe({
        next: (res: any) => {
          this.getData = false;
          const rows = (res.recordsets?.[0] || []).filter((r: any) => {
            const d = new Date(r.INV_DATE);
            return d >= this.startDate && d <= this.endDate;
          });
          this.processSupplierSOA({ recordsets: [rows] });
          this.ipwsoaData = rows;
        },
        error: () => {
          this.getData = false;
          alert('Failed to load Intermediary SOA');
        }
      });
  }

  printIPWSOA() {
    if (!this.startDate || !this.endDate) {
      alert('Please select both start and end dates.');
      return;
    } else {
    var doc = new jsPDF("portrait", "px", "a4");
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Statement of Account', 160, 20);
    doc.roundedRect(5, 32.5, 436, 65, 5, 5);
    doc.setFontSize(10);
    doc.text(`${this.selectedSupplier.CUST_NAME}`,10,42);
    doc.text(`Account ID: ${this.selectedSupplier.PCODE}`,330,42);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Date: ${this.mCurDate}`,330,52);
    doc.text('Nature',10,52);
    doc.text(`: ${this.selectedSupplier.Nature}`,45,52);
    doc.text('Category',10,62);
    doc.text(`: ${this.selectedSupplier.SupplierCategory}`,45,62);
    doc.text('Period',10,72);
    doc.text(`: ${this.formatDate(this.startDate)} - ${this.formatDate(this.endDate)}`, 45, 72)
    let firstPageStartY = 80; // Start Y position for first page
    let nextPagesStartY = 35; // Start Y position for subsequent pages
    let firstPage = true;      // Flag to check if it's the first page

    autoTable(doc, {
      html: '#ipwSoaTable',
      tableWidth: 436,
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
    /*  columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' }
      },*/
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

    autoTable(doc, {
      html: '#ipwsoaAgeingSummaryTable',
      startY: finalY1 + 5,
      tableWidth: 436,
      margin: { left: 5 },
      theme: 'grid',
      styles: {
        fontSize: 8,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        halign: 'center'
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
     /* columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' }
      }*/
    });
 
    // Add watermark (if necessary)
    doc = this.addWaterMark(doc,'p');
    // Save the PDF
    doc.save(`${this.selectedSupplier.PCODE}-statement-of-account-${this.mCurDate}-period-${this.startDate}-${this.endDate}.pdf`);
    }
  }

/* ---------------------------- OUTSTANDING (SOA BASED) ---------------------- */

  openSWOUT() {
    this.dialog.open(this.swoutLookupDialog, {
      width: '100vw',
      maxWidth: '100vw'
    });
  }

    printSWOUT() {
    var doc = new jsPDF('portrait', 'px', 'a4');
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.text('Supplier Outstanding Report', 150, 20);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.roundedRect(5, 32.5, 436, 25, 5, 5);
    doc.text(`Date: ${this.mCurDate}`,330,42);
    doc.text('Nature',10,42);
    doc.text(`: ${this.selectedNature}`,45,42);
    doc.text('Category',10,52);
    doc.text(`: ${this.selectedCategory}`,45,52);    
    doc.text('As On Date',330,52);
    doc.text(`: ${this.formatDate(this.endDate)}`,365,52); 
    let firstPageStartY = 60; // Start Y position for first page
    let nextPagesStartY = 35; // Start Y position for subsequent pages
    let firstPage = true;      // Flag to check if it's the first page

    autoTable(doc, {
      html: '#swOutTable',
      tableWidth: 436,
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
    /*  columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' }
      },*/
      margin: { 
        top: firstPage ? firstPageStartY : nextPagesStartY,
        left: 5
      },
      showFoot: 'lastPage', 
      didDrawPage: function () {
        firstPage = false;
      }
    });

    // Add watermark (if necessary)
    doc = this.addWaterMark(doc,'p');
    // Save the PDF
    doc.save(`SupplierOutstanding-ason-${this.formatDate(this.endDate)}-${this.formatDate(new Date())}.pdf`);
  }

  openIWOUT() {
    this.dialog.open(this.iwoutLookupDialog, {
      width: '100vw',
      maxWidth: '100vw'
    });
  }

  printIWOUT() {
    var doc = new jsPDF('portrait', 'px', 'a4');
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.text('Intermediary Outstanding Report', 150, 20);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.roundedRect(5, 32.5, 436, 25, 5, 5);
    doc.text(`Date: ${this.mCurDate}`,330,42);
    doc.text('Nature',10,42);
    doc.text(`: ${this.selectedNature}`,45,42);
    doc.text('Category',10,52);
    doc.text(`: ${this.selectedCategory}`,45,52);    
    doc.text('As On Date',330,52);
    doc.text(`: ${this.formatDate(this.endDate)}`,365,52); 
    let firstPageStartY = 60; // Start Y position for first page
    let nextPagesStartY = 35; // Start Y position for subsequent pages
    let firstPage = true;      // Flag to check if it's the first page

    autoTable(doc, {
      html: '#iwOutTable',
      tableWidth: 436,
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
    /*  columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' }
      },*/
      margin: { 
        top: firstPage ? firstPageStartY : nextPagesStartY,
        left: 5
      },
      showFoot: 'lastPage', 
      didDrawPage: function () {
        firstPage = false;
      }
    });

    // Add watermark (if necessary)
    doc = this.addWaterMark(doc,'p');
    // Save the PDF
    doc.save(`SupplierOutstanding-ason-${this.formatDate(this.endDate)}-${this.formatDate(new Date())}.pdf`);
  }

 /* ======================== TRANSACTION LISTING ============================= */

  openSWTRNLIST() {
    this.dialog.open(this.swtrnlistLookupDialog, {
      width: '100vw',
      maxWidth: '100vw'
    });
    this.resetTRN();
  }

  getSWTRNLIST(customer: any) {
    this.selectedSupplier = customer;
    this.getData = true;
    this.resetTRN();

    this.reportService
      .getApCustomerTrnList(this.selectedUnit.id, 'S', customer.PCODE)
      .subscribe({
        next: (res: any) => {
          this.getData = false;
          this.swtrnlistData = res.recordset || [];
        }, error: () => {
          this.getData = false;
          alert('Failed to load Supplier Transaction Listing');
        }
      });
  }

  printSWTRNLIST() {
    var doc = new jsPDF("portrait", "px", "a4");
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Supplier Transaction Listing', 150, 20);
    doc.roundedRect(5, 32.5, 436, 55, 5, 5);
    doc.setFontSize(10);
    doc.text(`${this.selectedSupplier.CUST_NAME}`,10,42);
    doc.text(`Account ID: ${this.selectedSupplier.PCODE}`,330,42);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Date: ${this.mCurDate}`,330,52);
    doc.text('Nature',10,52);
    doc.text(`: ${this.selectedSupplier.Nature}`,45,52);
    doc.text('Category',10,62);
    doc.text(`: ${this.selectedSupplier.SupplierCategory}`,45,62);
    let firstPageStartY = 70; // Start Y position for first page
    let nextPagesStartY = 35; // Start Y position for subsequent pages
    let firstPage = true;      // Flag to check if it's the first page

    autoTable(doc, {
      html: '#swTrnListTable',
      tableWidth: 436,
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
      /*columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' }
      },*/
      margin: { 
        top: firstPage ? firstPageStartY : nextPagesStartY,
        left: 5
      },
      showFoot: 'lastPage', 
      didDrawPage: function () {
        firstPage = false;
      }
    });


    // Add watermark (if necessary)
    doc = this.addWaterMark(doc,'p');
    // Save the PDF
    doc.save(`${this.selectedSupplier.PCODE}-transaction-listing-${this.mCurDate}.pdf`);
  }

  openIWTRNLIST() {
    this.dialog.open(this.iwtrnlistLookupDialog, {
      width: '100vw',
      maxWidth: '100vw'
    });
    this.resetTRN();
  }

  getIWTRNLIST(customer: any) {
    this.selectedSupplier = customer;
    this.getData = true;
    this.resetTRN();

    this.reportService
      .getApCustomerTrnList(this.selectedUnit.id, 'G', customer.PCODE)
.subscribe({
        next: (res: any) => {
          this.getData = false;
          this.iwtrnlistData = res.recordset || [];
        },
        error: () => {
          this.getData = false;
          alert('Failed to load Intermediary Transaction Listing');
        }
      });
  }

  printIWTRNLIST() {
    var doc = new jsPDF("portrait", "px", "a4");
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Intermediary Transaction Listing', 150, 20);
    doc.roundedRect(5, 32.5, 436, 55, 5, 5);
    doc.setFontSize(10);
    doc.text(`${this.selectedSupplier.CUST_NAME}`,10,42);
    doc.text(`Account ID: ${this.selectedSupplier.PCODE}`,330,42);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Date: ${this.mCurDate}`,330,52);
    doc.text('Nature',10,52);
    doc.text(`: ${this.selectedSupplier.Nature}`,45,52);
    doc.text('Category',10,62);
    doc.text(`: ${this.selectedSupplier.SupplierCategory}`,45,62);
    let firstPageStartY = 70; // Start Y position for first page
    let nextPagesStartY = 35; // Start Y position for subsequent pages
    let firstPage = true;      // Flag to check if it's the first page

    autoTable(doc, {
      html: '#iwTrnListTable',
      tableWidth: 436,
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
      /*columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' }
      },*/
      margin: { 
        top: firstPage ? firstPageStartY : nextPagesStartY,
        left: 5
      },
      showFoot: 'lastPage', 
      didDrawPage: function () {
        firstPage = false;
      }
    });

    // Add watermark (if necessary)
    doc = this.addWaterMark(doc,'p');
    // Save the PDF
    doc.save(`${this.selectedSupplier.PCODE}-transaction-listing-${this.mCurDate}.pdf`);
  }

  
/* ==================== TRANSACTION SUMMARY / OUTSTANDING =================== */

  openSWTRNSUM() {
    this.dialog.open(this.swtrnsumLookupDialog, {
      width: '100vw',
      maxWidth: '100vw'
    });
  }

  async applySupplierTranFilters() {
    this.getData = true;
    this.swtrnsumData = [];
    this.totalOutstanding = 0;

    const filtered = this.supplierList.filter(s =>
      this.searchText ? s.CUST_NAME.toLowerCase().includes(this.searchText.toLowerCase()) : true
    );

    const results = await Promise.all(
  filtered.map(async supplier => {
        const soa: any = await firstValueFrom(
          this.reportService.getSupplierSOA(this.selectedUnit.id, supplier.PCODE)
        );
        const rows = soa.recordsets?.[0] || [];
        const outstanding = rows.reduce((s: number, r: any) => s + (Number(r.BALANCE) || 0), 0);
        return { ...supplier, CURRENT_OUTSTANDING: outstanding };
      })
    );

    this.swtrnsumData = results;
    this.totalOutstanding = results.reduce((s, r) => s + (r.CURRENT_OUTSTANDING || 0), 0);
    this.getData = false;
  }

  printSWTRNSUM() {
    var doc = new jsPDF('portrait', 'px', 'a4');
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.text('Supplier Transaction Summary Report', 150, 20);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.roundedRect(5, 32.5, 436, 25, 5, 5);
    doc.text(`Date: ${this.mCurDate}`,330,42);
    doc.text('Nature',10,42);
    doc.text(`: ${this.selectedNature}`,45,42);
    doc.text('Category',10,52);
    doc.text(`: ${this.selectedCategory}`,45,52);    
    doc.text('As On Date',330,52);
    doc.text(`: ${this.formatDate(this.endDate)}`,365,52); 
    let firstPageStartY = 60; // Start Y position for first page
    let nextPagesStartY = 35; // Start Y position for subsequent pages
    let firstPage = true;      // Flag to check if it's the first page

    autoTable(doc, {
      html: '#swTrnSumTable',
      tableWidth: 436,
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
    /*  columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' }
      },*/
      margin: { 
        top: firstPage ? firstPageStartY : nextPagesStartY,
        left: 5
      },
      showFoot: 'lastPage', 
      didDrawPage: function () {
        firstPage = false;
      }
    });

    // Add watermark (if necessary)
    doc = this.addWaterMark(doc,'p');
    // Save the PDF
    doc.save(`Supplier-transaction-summary-ason-${this.formatDate(this.endDate)}-${this.formatDate(new Date())}.pdf`);
  }


  openIWTRNSUM() {
    this.dialog.open(this.iwtrnsumLookupDialog, {
      width: '100vw',
      maxWidth: '100vw'
    });
  }
  
 async applyIntermediaryTranFilters() {
    this.getData = true;
    this.iwtrnsumData = [];
    this.totalOutstanding = 0;

    const filtered = this.intermediariesList.filter(i =>
      this.searchText ? i.CUST_NAME.toLowerCase().includes(this.searchText.toLowerCase()) : true
    );

    const results = await Promise.all(
      filtered.map(async intermediary => {
        const soa: any = await firstValueFrom(
          this.reportService.getSupplierSOA(this.selectedUnit.id, intermediary.PCODE)
        );
        const rows = soa.recordsets?.[0] || [];
        const outstanding = rows.reduce((s: number, r: any) => s + (Number(r.BALANCE) || 0), 0);
        return { ...intermediary, CURRENT_OUTSTANDING: outstanding };
      })
    );

    this.iwtrnsumData = results;

this.totalOutstanding = results.reduce((s, r) => s + (r.CURRENT_OUTSTANDING || 0), 0);
    this.getData = false;
  }





/* ----------------------------- COMMON HELPERS ------------------------------ */

  private processSupplierSOA(res: any) {
    const rows = res.recordsets?.[0] || [];

    this.totalOutstanding = 0;
    this.ageingSummary = {
      CURRENT: 0,
      '30_DAYS': 0,
      '60_DAYS': 0,
      '90_DAYS': 0,
      'ABOVE_120_DAYS': 0
    };

    rows.forEach((r: any) => {
      const bal = Number(r.BALANCE) || 0;
      this.totalOutstanding += bal;

      this.ageingSummary.CURRENT += r.CURRENT || 0;
      this.ageingSummary['30_DAYS'] += r['1_30'] || 0;
      this.ageingSummary['60_DAYS'] += r['31_60'] || 0;
      this.ageingSummary['90_DAYS'] += r['61_90'] || 0;
      this.ageingSummary['ABOVE_120_DAYS'] += r['90_PLUS'] || 0;
    });

}

  private resetSOA() {
    this.swsoaData = [];
    this.spwsoaData = [];
    this.ipwsoaData = [];
    this.totalOutstanding = 0;
    this.ageingSummary = {
      CURRENT: 0,
      '30_DAYS': 0,
      '60_DAYS': 0,
      '90_DAYS': 0,
      'ABOVE_120_DAYS': 0
    };
  }

  private resetTRN() {
    this.swtrnlistData = [];
    this.iwtrnlistData = [];
    this.swtrnsumData = [];
    this.iwtrnsumData = [];
    this.totalOutstanding = 0;
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
        doc.addImage(img2, 'png', 2, 430, 10, 10);
        doc.text('IFAGATE',12.5, 440);
        doc.setFont('Helvetica','normal');
        doc.setFontSize(9);
        doc.setFont('Helvetica','normal');
        doc.text(`Page ${i} of ${totalPages}`,575,440);
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

  
exportTable(data: any[], file: string) {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = { Sheets: { Data: ws }, SheetNames: ['Data'] };
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    FileSaver.saveAs(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      file
    );
  }

  
/* ------------------------------- UTILITIES -------------------------------- */

  mapCountry(name: string): string {
    if (name.includes('Kuwait')) return 'Kuwait';
    if (name.includes('KSA') || name.includes('Saudi')) return 'Saudi Arabia';
    if (name.includes('Bahrain')) return 'Bahrain';
    if (name.includes('UAE')) return 'United Arab Emirates';
    if (name.includes('Oman')) return 'Oman';
    if (name.includes('Qatar')) return 'Qatar';
    return 'un';
  }

  mapFlagCode(name: string): string {
    if (name.includes('Kuwait')) return 'kw';
    if (name.includes('KSA') || name.includes('Saudi')) return 'sa';
    if (name.includes('Bahrain')) return 'bh';
    if (name.includes('UAE')) return 'ae';
    if (name.includes('Oman')) return 'om';
    if (name.includes('Qatar')) return 'qa';
    return 'un';
  }

 formatDate(date: any) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${d.getFullYear()}`;
  }

  private removeQuotes(val: string | null): string {
    return val ? val.replace(/^"|"$/g, '') : '';
  }


































    openSPWTRNLIST() {
    //let dialogRef = this.dialog.open(this.spwsoaLookupDialog);
    this.dialog.open(this.spwtrnlistLookupDialog, {
        width: '100vw',
        maxWidth: '100vw',
    }
  )
        this.periodTotalDebit = 0;
  this.periodTotalCredit = 0;
  
  this.openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
 
    this.spwtrnlistData = []
  }

  getSPWTRNLIST(customer: any) {
    this.spwtrnlistData = []
        this.periodTotalDebit = 0;
  this.periodTotalCredit = 0;
  
  this.openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
  
    this.selectedSupplier = customer
  }

setSPWTRNLIST() {
  if (!this.startDate || !this.endDate) {
    alert('Please select both start and end dates.');
    return;
  }
  this.openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };

  const start = new Date(this.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(this.endDate);
  end.setHours(23, 59, 59, 999);

  this.getData = true;

  this.reportService.getApCustomerTrnList(this.selectedUnit.id,'S', this.selectedSupplier.PCODE).subscribe((res: any) => {
    this.getData = false;
    if (res.recordset.length === 0) {
      alert('No data for the selected parameters!');
      return;
    }

 const data = res.recordset;
        this.getData = false

    let runningBalance = 0;
    this.ageingSummary = {
      CURRENT: 0,
      '30_DAYS': 0,
      '60_DAYS': 0,
      '90_DAYS': 0,
      //'120_DAYS': 0,
      'ABOVE_120_DAYS': 0
    };

  // Reset opening balance
  this.openingBalanceData = { DEBIT: 0, CREDIT: 0, BALANCE: 0 };

  // Calculate opening balance for transactions before startDat
  const openingData = data.filter((row: any) => {
  const txnDate = new Date(row.INV_DATE)
  txnDate.setHours(0,0,0,0)
  return txnDate < start
})

console.log(openingData)

  openingData.forEach((row: any) => {
    const debit = Number(row.REFAMOUNT );
    const credit = Number(row.INV_AMOUNT );
    this.openingBalanceData.DEBIT += credit;
    this.openingBalanceData.CREDIT += debit;
    this.openingBalanceData.BALANCE += (debit - credit);
  });

    // Filter transactions in selected period
var filteredPeriodRows = data.filter((row: any) => {
  const txnDate = new Date(row.INV_DATE)
  return txnDate >= start && txnDate <= end
})

console.log(filteredPeriodRows)


  for(let i=0; i<filteredPeriodRows.length; i++){
    const debit = Number(filteredPeriodRows[i].REFAMOUNT) || 0;
    const credit = Number(filteredPeriodRows[i].INV_AMOUNT) || 0;

    this.periodTotalDebit += debit;
    this.periodTotalCredit += credit;
  }

// Build opening balance row
const openingRow = {
  INV_NO: 'OPENING BALANCE',
  INV_DATE: null,
  REFAMOUNT: this.openingBalanceData.DEBIT,
  INV_AMOUNT: this.openingBalanceData.CREDIT,
  BALANCE: this.openingBalanceData.CREDIT - this.openingBalanceData.DEBIT,
  DAYS_DIFF: null,
  DUEDATE: null,
  DOC_TYPE: '',
  REMARKS: '',
  VENDOR_REF_NO: '',
  CUST_REF_NO: '',
  //...this.selectedSupplier // optional: to keep column structure consistent
};

    if(filteredPeriodRows.length === 0) {
      alert('No data available in selected range!')
    }

    // Calculate period-wise balances
    let periodRunningBalance = this.openingBalanceData.CREDIT - this.openingBalanceData.DEBIT;
    filteredPeriodRows = filteredPeriodRows.map((row: any) => {
      const debit = Number(row.REFAMOUNT ) || 0;
      const credit = Number(row.INV_AMOUNT ) || 0;

      periodRunningBalance += debit - credit;

      return {
        ...row,
        BALANCE: periodRunningBalance
      };
    });

    // Combine into final list
this.spwtrnlistData = [openingRow, ...filteredPeriodRows]


    // 🔹 Apply FIFO + ageing on period data
//const fifoInput = filteredPeriodRows;
//const result = this.applySupplierFifoAndAgeing(fifoInput, this.endDate);

  //  this.ageingSummary = result.ageing;
    //this.closingBalance = this.openingBalanceData.BALANCE + result.totalBalance;

  }, (err: any) => {
    this.getData = false;
    alert('No data for the selected parameters!');
  });
}

  printSPWTRNLIST() {
    if (!this.startDate || !this.endDate) {
      alert('Please select both start and end dates.');
      return;
    } else {
    var doc = new jsPDF("portrait", "px", "a4");
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Supplier Transaction Listing', 150, 20);
    doc.roundedRect(5, 32.5, 436, 65, 5, 5);
    doc.setFontSize(10);
    doc.text(`${this.selectedSupplier.CUST_NAME}`,10,42);
    doc.text(`Account ID: ${this.selectedSupplier.PCODE}`,330,42);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Date: ${this.mCurDate}`,330,52);
    doc.text('Nature',10,52);
    doc.text(`: ${this.selectedSupplier.Nature}`,45,52);
    doc.text('Category',10,62);
    doc.text(`: ${this.selectedSupplier.SupplierCategory}`,45,62);
    doc.text('Period',10,72);
    doc.text(`: ${this.formatDate(this.startDate)} - ${this.formatDate(this.endDate)}`, 45, 72)
    let firstPageStartY = 80; // Start Y position for first page
    let nextPagesStartY = 35; // Start Y position for subsequent pages
    let firstPage = true;      // Flag to check if it's the first page

    autoTable(doc, {
      html: '#spwTrnListTable',
      tableWidth: 436,
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
    /*  columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' }
      },*/
      margin: { 
        top: firstPage ? firstPageStartY : nextPagesStartY,
        left: 5
      },
      showFoot: 'lastPage', 
      didDrawPage: function () {
        firstPage = false;
      }
    });

    /*let finalY1 = doc.lastAutoTable?.finalY || 0

    autoTable(doc, {
      html: '#spwsoaAgeingSummaryTable',
      startY: finalY1 + 5,
      tableWidth: 436,
      margin: { left: 5 },
      theme: 'grid',
      styles: {
        fontSize: 8,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        halign: 'center'
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
     /* columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' }
      }*/
    //});*/
 
    // Add watermark (if necessary)
    doc = this.addWaterMark(doc,'p');
    // Save the PDF
    doc.save(`${this.selectedSupplier.PCODE}-transaction-listing-${this.mCurDate}-period-${this.startDate}-${this.endDate}.pdf`);
    }
  }



    openIPWTRNLIST() {
    //let dialogRef = this.dialog.open(this.spwsoaLookupDialog);
    this.dialog.open(this.ipwtrnlistLookupDialog, {
        width: '100vw',
        maxWidth: '100vw',
    }
  )
        this.periodTotalDebit = 0;
  this.periodTotalCredit = 0;
  this.openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
    this.ipwtrnlistData = []
  }

  getIPWTRNLIST(customer: any) {
    this.ipwtrnlistData = []
        this.periodTotalDebit = 0;
  this.periodTotalCredit = 0;
  
  this.openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
  
    this.selectedSupplier = customer
  }

setIPWTRNLIST() {
  if (!this.startDate || !this.endDate) {
    alert('Please select both start and end dates.');
    return;
  }
      this.periodTotalDebit = 0;
  this.periodTotalCredit = 0;
  
  this.openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
  

  const start = new Date(this.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(this.endDate);
  end.setHours(23, 59, 59, 999);

  this.getData = true;

  this.reportService.getApCustomerTrnList(this.selectedUnit.id,'G', this.selectedSupplier.PCODE).subscribe((res: any) => {
    this.getData = false;
    if (res.recordset.length === 0) {
      alert('No data for the selected parameters!');
      return;
    }

 const data = res.recordset;
        this.getData = false

    let runningBalance = 0;
    this.ageingSummary = {
      CURRENT: 0,
      '30_DAYS': 0,
      '60_DAYS': 0,
      '90_DAYS': 0,
      //'120_DAYS': 0,
      'ABOVE_120_DAYS': 0
    };

  // Reset opening balance
  this.openingBalanceData = { DEBIT: 0, CREDIT: 0, BALANCE: 0 };

  // Calculate opening balance for transactions before startDat
  const openingData = data.filter((row: any) => {
  const txnDate = new Date(row.INV_DATE)
  txnDate.setHours(0,0,0,0)
  return txnDate < start
})

console.log(openingData)

  openingData.forEach((row: any) => {
    const debit = Number(row.REFAMOUNT );
    const credit = Number(row.INV_AMOUNT );
    this.openingBalanceData.DEBIT += credit;
    this.openingBalanceData.CREDIT += debit;
    this.openingBalanceData.BALANCE += (debit - credit);
  });

    // Filter transactions in selected period
var filteredPeriodRows = data.filter((row: any) => {
  const txnDate = new Date(row.INV_DATE)
  return txnDate >= start && txnDate <= end
})

console.log(filteredPeriodRows)


  for(let i=0; i<filteredPeriodRows.length; i++){
    const debit = Number(filteredPeriodRows[i].REFAMOUNT) || 0;
    const credit = Number(filteredPeriodRows[i].INV_AMOUNT) || 0;

    this.periodTotalDebit += debit;
    this.periodTotalCredit += credit;
  }

// Build opening balance row
const openingRow = {
  INV_NO: 'OPENING BALANCE',
  INV_DATE: null,
  REFAMOUNT: this.openingBalanceData.DEBIT,
  INV_AMOUNT: this.openingBalanceData.CREDIT,
  BALANCE: this.openingBalanceData.CREDIT - this.openingBalanceData.DEBIT,
  DAYS_DIFF: null,
  DUEDATE: null,
  DOC_TYPE: '',
  REMARKS: '',
  VENDOR_REF_NO: '',
  CUST_REF_NO: '',
  //...this.selectedSupplier // optional: to keep column structure consistent
};

    if(filteredPeriodRows.length === 0) {
      alert('No data available in selected range!')
    }

    // Calculate period-wise balances
    let periodRunningBalance = this.openingBalanceData.CREDIT - this.openingBalanceData.DEBIT;
    filteredPeriodRows = filteredPeriodRows.map((row: any) => {
      const debit = Number(row.REFAMOUNT ) || 0;
      const credit = Number(row.INV_AMOUNT ) || 0;

      periodRunningBalance += debit - credit;

      return {
        ...row,
        BALANCE: periodRunningBalance
      };
    });

    // Combine into final list
this.ipwtrnlistData = [openingRow, ...filteredPeriodRows]


    // 🔹 Apply FIFO + ageing on period data
//const fifoInput = filteredPeriodRows;
//const result = this.applySupplierFifoAndAgeing(fifoInput, this.endDate);

  //  this.ageingSummary = result.ageing;
    //this.closingBalance = this.openingBalanceData.BALANCE + result.totalBalance;

  }, (err: any) => {
    this.getData = false;
    alert('No data for the selected parameters!');
  });
}

  printIPWTRNLIST() {
    if (!this.startDate || !this.endDate) {
      alert('Please select both start and end dates.');
      return;
    } else {
    var doc = new jsPDF("portrait", "px", "a4");
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Intermediary Transaction Listing', 150, 20);
    doc.roundedRect(5, 32.5, 436, 65, 5, 5);
    doc.setFontSize(10);
    doc.text(`${this.selectedSupplier.CUST_NAME}`,10,42);
    doc.text(`Account ID: ${this.selectedSupplier.PCODE}`,330,42);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Date: ${this.mCurDate}`,330,52);
    doc.text('Nature',10,52);
    doc.text(`: ${this.selectedSupplier.Nature}`,45,52);
    doc.text('Category',10,62);
    doc.text(`: ${this.selectedSupplier.SupplierCategory}`,45,62);
    doc.text('Period',10,72);
    doc.text(`: ${this.formatDate(this.startDate)} - ${this.formatDate(this.endDate)}`, 45, 72)
    let firstPageStartY = 80; // Start Y position for first page
    let nextPagesStartY = 35; // Start Y position for subsequent pages
    let firstPage = true;      // Flag to check if it's the first page

    autoTable(doc, {
      html: '#ipwTrnListTable',
      tableWidth: 436,
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
    /*  columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' }
      },*/
      margin: { 
        top: firstPage ? firstPageStartY : nextPagesStartY,
        left: 5
      },
      showFoot: 'lastPage', 
      didDrawPage: function () {
        firstPage = false;
      }
    });

    // Add watermark (if necessary)
    doc = this.addWaterMark(doc,'p');
    // Save the PDF
    doc.save(`${this.selectedSupplier.PCODE}-transaction-listing-${this.mCurDate}-period-${this.startDate}-${this.endDate}.pdf`);
    }
  }


    
  printIWTRNSUM() {
    var doc = new jsPDF('portrait', 'px', 'a4');
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.text('Intermediary Transaction Summary Report', 150, 20);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.roundedRect(5, 32.5, 436, 25, 5, 5);
    doc.text(`Date: ${this.mCurDate}`,330,42);
    doc.text('Nature',10,42);
    //doc.text(`: ${this.selectedNature}`,45,42);
    doc.text('Category',10,52);
    //doc.text(`: ${this.selectedCategory}`,45,52);    
    doc.text('As On Date',330,52);
    doc.text(`: ${this.formatDate(this.endDate)}`,365,52); 
    let firstPageStartY = 60; // Start Y position for first page
    let nextPagesStartY = 35; // Start Y position for subsequent pages
    let firstPage = true;      // Flag to check if it's the first page

    autoTable(doc, {
      html: '#iwTrnSumTable',
      tableWidth: 436,
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
    /*  columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' }
      },*/
      margin: { 
        top: firstPage ? firstPageStartY : nextPagesStartY,
        left: 5
      },
      showFoot: 'lastPage', 
      didDrawPage: function () {
        firstPage = false;
      }
    });

    // Add watermark (if necessary)
    doc = this.addWaterMark(doc,'p');
    // Save the PDF
    doc.save(`Intermediary-transaction-summary-ason-${this.formatDate(this.endDate)}-${this.formatDate(new Date())}.pdf`);
  }


async computeTranOutstanding(
  supplierCode: string,
  asOfDate: Date,
  type: string
): Promise<number> {
  try {

    const res: any = await firstValueFrom(
      this.reportService.getApCustomerTrnList(this.selectedUnit.id, type, supplierCode)
    );

    const end = new Date(asOfDate);
    end.setHours(23, 59, 59, 999);

    const txns = (res.recordset || []).filter((row: any) => {
      if (!row.INV_DATE) return false;
      return new Date(row.INV_DATE) <= end;
    });

    if (!txns.length) return 0;

    let balance = 0;

    for (const row of txns) {
      const credit = Number((row.INV_AMOUNT ?? 0).toString().replace(/,/g, '')) || 0;
      const debit  = Number((row.REFAMOUNT ?? 0).toString().replace(/,/g, '')) || 0;

      balance += credit;
      balance -= debit;
    }

    return balance;

  } catch (err) {
    console.error('Failed to fetch SOA for supplier:', supplierCode, err);
    return 0;
  }
}
}