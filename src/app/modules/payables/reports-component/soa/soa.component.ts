
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
  @ViewChild('swoutLookupDialog', { static: false }) swoutLookupDialog!: TemplateRef<any>;
  @ViewChild('swtrnlistLookupDialog', { static: false }) swtrnlistLookupDialog!: TemplateRef<any>;
  @ViewChild('spwtrnlistLookupDialog', { static: false }) spwtrnlistLookupDialog!: TemplateRef<any>;
  @ViewChild('iwtrnlistLookupDialog', { static: false }) iwtrnlistLookupDialog!: TemplateRef<any>;
  @ViewChild('ipwtrnlistLookupDialog', { static: false }) ipwtrnlistLookupDialog!: TemplateRef<any>;


  /* ---------------------------------- DATES --------------------------------- */

  currentYear = new Date().getFullYear();
  mCurDate = this.formatDate(new Date());
  startDate = '2025-01-01'
  endDate= '2025-12-31';


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
  swoutData: any[] = []
  swtrnlistData: any[] = []
  spwtrnlistData: any[] = []
  iwtrnlistData: any[] = []
  ipwtrnlistData: any[] = []

  soaData: any[] = [];

  kpiCards: any[] = [];
  ageingChart: any[] = [];
  overduePie: any[] = [];
  categoryChart: any[] = [];
  topSuppliers: any[] = [];
  currencyChart: any[] = [];


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

ngOnInit() {
  this.loadSalesUnits();
    
  }

  loadSOA() {
    this.reportService.getSupplierAgeingData(this.selectedUnit.id, this.formatDate(this.mCurDate)).subscribe((res: any) => {
      this.soaData = res.recordset || [];
      this.buildKPIs();
      this.buildAgeing();
      this.buildOverdue();
      this.buildCategory();
      this.buildTopSuppliers();
      this.buildCurrency();
    });
  }

  
/* ---------------- KPIs ---------------- */
buildKPIs() {
  let total = 0;
  let overdue = 0;
  let notDue = 0;
  let overdueDaysSum = 0;
  let overdueCount = 0;

  const supplierTotals: any = {};
  const currencyTotals: any = {};

  const today = new Date();

  this.soaData.forEach(r => {
    const bal = Number(r.BALANCE) || 0;
    const due = r.DUEDATE ? new Date(r.DUEDATE) : null;

    total += bal;

    if (due && due < today) {
      overdue += bal;
      overdueDaysSum += Math.floor(
        (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
      );
      overdueCount++;
    } else {
      notDue += bal;
    }

    supplierTotals[r.CUST_NAME] =
      (supplierTotals[r.CUST_NAME] || 0) + bal;

    currencyTotals[r.LPO_NO] =
      (currencyTotals[r.LPO_NO] || 0) + bal;
  });

  const top5Exposure = Object.values(supplierTotals)
    .sort((a: any, b: any) => b - a)
    .slice(0, 5)
    .reduce((a: any, b: any) => a + b, 0);

  this.kpiCards = [
    { label: 'Total Payables', value: total, color: '#F59E0B' },
    { label: 'Overdue', value: overdue, color: '#EF4444' },
    { label: 'Not Yet Due', value: notDue, color: '#10B981' },
    {
      label: '% Overdue',
      value: total ? (overdue / total) * 100 : 0,
      color: '#DC2626'
    },
    {
      label: 'Top 5 Suppliers',
      value: top5Exposure,
      color: '#7C3AED'
    },
    {
      label: 'Avg Days Overdue',
      value: overdueCount ? overdueDaysSum / overdueCount : 0,
      color: '#2563EB'
    }
  ];
}

/* ---------------- AGEING ---------------- */
  buildAgeing() {
    const buckets = ['CURRENT','1_30','31_60','61_90','90_PLUS'];

    this.ageingChart = buckets.map(b => ({
      name: b.replace('_', '-'),
      value: 
        this.soaData.reduce((s, r) => s + (Number(r[b]) || 0), 0)
      
    }));
  }

  /* ---------------- OVERDUE ---------------- */
buildOverdue() {
  let overdue = 0;
  let notDue = 0;
  const today = new Date();

  this.soaData.forEach(r => {
    if (!r.DUEDATE || r.DOC_NO?.startsWith('OPENING')) return;

    const bal = Number(r.BALANCE) || 0;
    const due = new Date(r.DUEDATE);

    if (due < today) overdue += bal;
    else notDue += bal;
  });

  this.overduePie = [
    { name: 'Overdue', value: overdue },
    { name: 'Not Due', value: notDue }
  ];
}

  /* ---------------- CATEGORY ---------------- */
buildCategory() {
  const map: any = {};

  this.soaData.forEach(r => {
    const category = r.SupplierCategory || 'Uncategorised';
    const val = Number(r.BALANCE) || 0;

    map[category] = (map[category] || 0) + val;
  });

  this.categoryChart = Object.entries(map)
    .filter(([_, v]: any) => v > 0)
    .map(([name, value]) => ({ name, value }));
}


  /* ---------------- TOP SUPPLIERS ---------------- */
  buildTopSuppliers() {
    const map: any = {};

    this.soaData.forEach(r => {
      map[r.CUST_NAME] = (map[r.CUST_NAME] || 0) + Number(r.BALANCE);
    });

    this.topSuppliers = Object.entries(map)
      .map(([name, total]) => ({ name, total }))
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 10);
  }

  /* ---------------- CURRENCY ---------------- */
  buildCurrency() {
    const map: any = {};
    this.soaData.forEach(r => {
      map[r.LPO_NO] = (map[r.LPO_NO] || 0) + Number(r.BALANCE);
    });

this.currencyChart = Object.entries(map)
      .map(([name, value]) => ({ name, value }));
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
      this.salesUnits = 
        data.map((u: any) => ({
          id: u.salesunitID,
          name: u.salesunitname,
          code: this.mapFlagCode(u.salesunitname),
          country: this.mapCountry(u.salesunitname)
        }))
        this.updateUnit(this.salesUnits[0]);
    });
  }

  updateUnit(unit: any) {
    this.selectedUnit = unit;
    this.selectedCountryCode = unit.code;
    this.loadSOA();
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
    .getSupplierSOA(this.selectedUnit.id, customer.PCODE, this.formatDate(this.mCurDate))
    .subscribe({
      next: (res: any) => {
        this.getData = false;
        console.log(res.recordset)
        const rows = res.recordset || [];

        let running = 0;
        this.swsoaData = rows.map((r: any) => {
          running += r.BALANCE; // +invoice, -receipt
          return {
            ...r,
            RUNNING_BALANCE: running
          };
        });
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

  this.resetSOA();
}
  
  setSPWSOA() {
    if (!this.selectedSupplier || !this.startDate || !this.endDate) {
      alert('Please select supplier and date range');
      return;
    }
    this.getData = true;

    this.reportService
      .getSupplierSOA(this.selectedUnit.id, this.selectedSupplier.PCODE, this.endDate)
      .subscribe({
        next: (res: any) => {
          this.getData = false;
          const end = new Date(this.endDate);
          end.setHours(23, 59, 59, 999);

          /*const rows = (res.recordsets?.[0] || []).filter((r: any) => {
            const d = new Date(r.DOC_DATE);
            return d <= end;
          });*/
          let running = 0;
          this.spwsoaData = res.recordset.map((r: any) => {
            running += Number(r.BALANCE || 0);
            return {
              ...r,
              RUNNING_BALANCE: running
            };
          });
          console.table(this.spwsoaData);
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

/* ---------------------------- OUTSTANDING (SOA BASED) ---------------------- */

  openSWOUT() {
    this.dialog.open(this.swoutLookupDialog, {
      width: '100vw',
      maxWidth: '100vw'
    });
  }

  async applySupplierFilters() {
    if (!this.endDate) {
      alert('Please select end date');
      return;
    }

    this.getData = true;
    this.swoutData = [];
    this.totalOutstanding = 0;

    const end = new Date(this.endDate);
    end.setHours(23, 59, 59, 999);

    try {
      // ✅ ONE API CALL
      const res: any = await firstValueFrom(
        this.reportService.getSupplierAgeingData(this.selectedUnit.id, this.endDate)
      );

    const rows = res.recordset || [];

    /* -----------------------------------------------------------
       2️⃣ FILTER BY SEARCH / NATURE / CATEGORY
       ----------------------------------------------------------- */

    const uiFiltered = rows.filter((r: any) => {
      const matchesSearch = this.searchText
        ? r.CUST_NAME?.toLowerCase().includes(this.searchText.toLowerCase())
        : true;

      const matchesNature = this.selectedNature
        ? r.Nature === this.selectedNature
        : true;

      const matchesCategory = this.selectedCategory
        ? r.SupplierCategory === this.selectedCategory
        : true;

      return matchesSearch && matchesNature && matchesCategory;
    });

    /* -----------------------------------------------------------
       3️⃣ GROUP BY SUPPLIER + CALCULATE AGEING
       ----------------------------------------------------------- */

    const map = new Map<string, any>();

    for (const r of uiFiltered) {
      const key = r.CUST_CODE;

      if (!map.has(key)) {
        map.set(key, {
          PCODE: r.CUST_CODE,
          CUST_NAME: r.CUST_NAME,
          Nature: r.Nature,
          SupplierCategory: r.SupplierCategory,
          REMARKS: r.PaymentTerms,

          CURRENT_OUTSTANDING: 0,
          CURRENT: 0,
          '1_30': 0,
          '31_60': 0,
          '61_90': 0,
          '90_PLUS': 0
        });
      }

      const s = map.get(key);

      const dueDate = r.DUEDATE ? new Date(r.DUEDATE) : null;

      // ✅ Outstanding only when due <= endDate
      //if (dueDate && dueDate <= end) {
        s.CURRENT_OUTSTANDING += Number(r.BALANCE) || 0;
      //}

      s.CURRENT += Number(r.CURRENT) || 0;
      s['1_30'] += Number(r['1_30']) || 0;
      s['31_60'] += Number(r['31_60']) || 0;
      s['61_90'] += Number(r['61_90']) || 0;
      s['90_PLUS'] += Number(r['90_PLUS']) || 0;
    }

    /* -----------------------------------------------------------
       4️⃣ FINAL OUTPUT
       ----------------------------------------------------------- */

    this.swoutData = Array.from(map.values()).filter(
      s => s.CURRENT_OUTSTANDING > 0.001
    );

    this.totalOutstanding = this.swoutData.reduce(
      (sum, s) => sum + s.CURRENT_OUTSTANDING,
      0
    );

  } catch (err) {
    console.error(err);
    alert('Failed to load Supplier Outstanding');
  } finally {
    this.getData = false;
  }
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
          console.log(res)
          this.getData = false;
          let running = 0;
          this.swtrnlistData = res.recordset.map((r: any) => {
            running += (r.INV_AMOUNT - r.REFAMOUNT); // +invoice, -receipt
            return {
              ...r,
              RUNNING_BALANCE: running
            };
          });
          //this.swtrnlistData = res.recordset || [];
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

  openSPWTRNLIST() {
    //let dialogRef = this.dialog.open(this.spwsoaLookupDialog);
    this.dialog.open(this.spwtrnlistLookupDialog, {
      width: '100vw',
      maxWidth: '100vw',
    })
    this.resetTRN();
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

     this.reportService
      .getApCustomerTrnList(this.selectedUnit.id, 'S', this.selectedSupplier.PCODE)
      .subscribe({
        next: (res: any) => {
          console.log(res)
          this.getData = false;
          let running = 0;
          this.openingBalanceData = { DEBIT: 0, CREDIT: 0, BALANCE: 0 };

          const openingData = res.recordset.filter((row: any) => {
            const txnDate = new Date(row.INV_DATE)
            txnDate.setHours(0,0,0,0)
            return txnDate < start
          })
          console.log(openingData)
          openingData.forEach((row: any) => {
            this.openingBalanceData.DEBIT += Number(row.REFAMOUNT );
            this.openingBalanceData.CREDIT += Number(row.INV_AMOUNT );
            this.openingBalanceData.BALANCE += (Number(row.INV_AMOUNT - Number(row.REFAMOUNT )));
          });

          // Build opening balance row
          const openingRow = {
            INV_NO: 'OPENING BALANCE',
            INV_DATE: null,
            REFAMOUNT: this.openingBalanceData.DEBIT,
            INV_AMOUNT: this.openingBalanceData.CREDIT,
            BALANCE: this.openingBalanceData.BALANCE,
            DAYS_DIFF: null,
            DUEDATE: null,
            DOC_TYPE: '',
            REMARKS: '',
            VENDOR_REF_NO: '',
            CUST_REF_NO: '',
          };

          // Filter transactions in selected period
          /*var filteredPeriodRows = res.recordset.filter((row: any) => {
            const txnDate = new Date(row.INV_DATE)
            return txnDate >= start && txnDate <= end
          })*/

          var filteredPeriodRows = res.recordset.filter((row: any) => {
            const txnDate = new Date(row.INV_DATE)
            return txnDate >= start && txnDate <= end
          })
          
          var temp = [openingRow, ...filteredPeriodRows]

          this.spwtrnlistData =  temp.map((r: any) => {
            running += (r.INV_AMOUNT - r.REFAMOUNT); // +invoice, -receipt
            return {
              ...r,
              BALANCE: running
            };
          });
        }, error: () => {
          this.getData = false;
          alert('Failed to load Supplier Transaction Listing');
        }
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
          console.log(res)
          this.getData = false;
          let running = 0;
          this.iwtrnlistData = res.recordset.map((r: any) => {
            running += (r.INV_AMOUNT - r.REFAMOUNT); // +invoice, -receipt
            return {
              ...r,
              RUNNING_BALANCE: running
            };
          });
          //this.swtrnlistData = res.recordset || [];
        }, error: () => {
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

  openIPWTRNLIST() {
    //let dialogRef = this.dialog.open(this.spwsoaLookupDialog);
    this.dialog.open(this.ipwtrnlistLookupDialog, {
      width: '100vw',
      maxWidth: '100vw',
    })
    this.resetTRN();
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

     this.reportService
      .getApCustomerTrnList(this.selectedUnit.id, 'G', this.selectedSupplier.PCODE)
      .subscribe({
        next: (res: any) => {
          console.log(res)
          this.getData = false;
          let running = 0;
          this.openingBalanceData = { DEBIT: 0, CREDIT: 0, BALANCE: 0 };

          const openingData = res.recordset.filter((row: any) => {
            const txnDate = new Date(row.INV_DATE)
            txnDate.setHours(0,0,0,0)
            return txnDate < start
          })
          console.log(openingData)
          openingData.forEach((row: any) => {
            this.openingBalanceData.DEBIT += Number(row.REFAMOUNT );
            this.openingBalanceData.CREDIT += Number(row.INV_AMOUNT );
            this.openingBalanceData.BALANCE += (Number(row.INV_AMOUNT - Number(row.REFAMOUNT )));
          });

          // Build opening balance row
          const openingRow = {
            INV_NO: 'OPENING BALANCE',
            INV_DATE: null,
            REFAMOUNT: this.openingBalanceData.DEBIT,
            INV_AMOUNT: this.openingBalanceData.CREDIT,
            BALANCE: this.openingBalanceData.BALANCE,
            DAYS_DIFF: null,
            DUEDATE: null,
            DOC_TYPE: '',
            REMARKS: '',
            VENDOR_REF_NO: '',
            CUST_REF_NO: '',
          };

          // Filter transactions in selected period
          /*var filteredPeriodRows = res.recordset.filter((row: any) => {
            const txnDate = new Date(row.INV_DATE)
            return txnDate >= start && txnDate <= end
          })*/

          var filteredPeriodRows = res.recordset.filter((row: any) => {
            const txnDate = new Date(row.INV_DATE)
            return txnDate >= start && txnDate <= end
          })
          
          var temp = [openingRow, ...filteredPeriodRows]

          this.ipwtrnlistData =  temp.map((r: any) => {
            running += (r.INV_AMOUNT - r.REFAMOUNT); // +invoice, -receipt
            return {
              ...r,
              BALANCE: running
            };
          });
        }, error: () => {
          this.getData = false;
          alert('Failed to load Intermediary Transaction Listing');
        }
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

/* ----------------------------- COMMON HELPERS ------------------------------ */

  private resetSOA() {
    this.swsoaData = [];
    this.spwsoaData = [];
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
    this.spwtrnlistData = [];
    this.iwtrnlistData = [];
    this.ipwtrnlistData = [];
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
    return `${d.getFullYear()}-${month}-${day}`;
  }

  private removeQuotes(val: string | null): string {
    return val ? val.replace(/^"|"$/g, '') : '';
  }

}