
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AccountsService } from 'src/app/services/accounts/accounts.service';
import { ReportsService } from 'src/app/services/reports/reports.service';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { firstValueFrom } from 'rxjs';
import { forkJoin } from 'rxjs';

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
  @ViewChild('swageLookupDialog', { static: false }) swageLookupDialog!: TemplateRef<any>;
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
  iwtrnlistGroupedData: any[] = [];
  intermediaryGrandTotals = {
    debit: 0,
    credit: 0,
    balance: 0
  };  
  ipwtrnlistGroupedData: any[] = [];

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
    /*this.accountService.listOpbal(this.currentYear.toString(),'G').subscribe((res: any) => {
      this.getData = false;
      console.log(res.recordset)
      this.intermediariesList = res.recordset;
    }, (err:any) => {
      this.getData = false;
      alert('Failed to load suppliers!');
    });*/
    this.intermediariesList = [
  {
    CUST_NAME: 'Petzone Market Company - Kuwait',
    GLCODES: ['102311']
  },
  {
    CUST_NAME: 'Basic General Trading - Kuwait',
    GLCODES: ['102312', '201312']
  },
  {
    CUST_NAME: 'United Shipping Co.',
    GLCODES: ['102313', '201313']
  },
  {
    CUST_NAME: 'Basic General Trading - UAE',
    GLCODES: ['102321', '201321']
  },
  {
    CUST_NAME: 'Petzone LLC - UAE',
    GLCODES: ['102323']
  },
  {
    CUST_NAME: 'Petzone KSA',
    GLCODES: ['102324', '201324']
  },
  {
    CUST_NAME: 'Petzone Qatar',
    GLCODES: ['102325']
  },
  {
    CUST_NAME: 'Petzone Bahrain',
    GLCODES: ['102326']
  }
];
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

    /*this.accountService.listOpbal(this.currentYear.toString(), 'G')
      .subscribe((res: any) => this.intermediariesList = res.recordset || []);*/

          this.intermediariesList = [
  {
    CUST_NAME: 'Petzone Market Company - Kuwait',
    GLCODES: ['102311']
  },
  {
    CUST_NAME: 'Basic General Trading - Kuwait',
    GLCODES: ['102312', '201312']
  },
  {
    CUST_NAME: 'United Shipping Co.',
    GLCODES: ['102313', '201313']
  },
  {
    CUST_NAME: 'Basic General Trading - UAE',
    GLCODES: ['102321', '201321']
  },
  {
    CUST_NAME: 'Petzone LLC - UAE',
    GLCODES: ['102323']
  },
  {
    CUST_NAME: 'Petzone KSA',
    GLCODES: ['102324', '201324']
  },
  {
    CUST_NAME: 'Petzone Qatar',
    GLCODES: ['102325']
  },
  {
    CUST_NAME: 'Petzone Bahrain',
    GLCODES: ['102326']
  }
];

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
    console.log(res)
    const data = res.recordset || [];

    this.salesUnits = data.map((u: any) => ({
      id: u.salesunitID,
      name: u.salesunitname,
      code: this.mapFlagCode(u.salesunitname),
      country: this.mapCountry(u.salesunitname)
    }));

    // ✅ Get deptid from storage
    const deptId = JSON.parse(localStorage.getItem('deptid') || 'null');

    if (deptId === 'A') {
      // ✅ Admin → ALL → select first
      this.updateUnit(this.salesUnits[0]);
    } else {
      // ✅ Find matching unit
      const matchedUnit = this.salesUnits.find(u => u.id === deptId);

      if (matchedUnit) {
        this.updateUnit(matchedUnit);
        this.salesUnits = this.salesUnits.filter(u => u.id === deptId);
      } else {
        // fallback
        this.updateUnit(this.salesUnits[0]);
      }
    }
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
    const res: any = await firstValueFrom(
      this.reportService.getSupplierAgeingData(this.selectedUnit.id, this.endDate)
    );

    const rows = res.recordset || [];

    /* -----------------------------------------------------------
       1️⃣ FILTER (SEARCH / NATURE / CATEGORY)
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
       2️⃣ GROUP BY SUPPLIER
    ----------------------------------------------------------- */

    const supplierMap = new Map<string, any>();

    for (const r of uiFiltered) {

      const key = r.CUST_CODE;

      if (!supplierMap.has(key)) {
        supplierMap.set(key, {
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

      const s = supplierMap.get(key);

      s.CURRENT_OUTSTANDING += Number(r.BALANCE) || 0;

      s.CURRENT += Number(r.CURRENT) || 0;
      s['1_30'] += Number(r['1_30']) || 0;
      s['31_60'] += Number(r['31_60']) || 0;
      s['61_90'] += Number(r['61_90']) || 0;
      s['90_PLUS'] += Number(r['90_PLUS']) || 0;
    }

    /* -----------------------------------------------------------
       3️⃣ GROUP BY CATEGORY + SUBTOTAL
    ----------------------------------------------------------- */

    const categoryMap = new Map<string, any>();

    for (const s of Array.from(supplierMap.values())) {

      if (s.CURRENT_OUTSTANDING <= 0.001) continue;

      const category = s.SupplierCategory || 'Uncategorized';

      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category: category,
          subtotal: 0,
          suppliers: []
        });
      }

      const group = categoryMap.get(category);

      group.suppliers.push(s);
      group.subtotal += s.CURRENT_OUTSTANDING;
    }

    /* -----------------------------------------------------------
       4️⃣ SORT (OPTIONAL BUT RECOMMENDED)
    ----------------------------------------------------------- */

    const finalData = Array.from(categoryMap.values());

    finalData.sort((a, b) => a.category.localeCompare(b.category));

    finalData.forEach(group => {
      group.suppliers.sort((a: any, b: any) =>
        a.CUST_NAME.localeCompare(b.CUST_NAME)
      );
    });

    /* -----------------------------------------------------------
       5️⃣ FINAL OUTPUT
    ----------------------------------------------------------- */

    this.swoutData = finalData;

    this.totalOutstanding = finalData.reduce(
      (sum, g) => sum + g.subtotal,
      0
    );

  } catch (err) {
    console.error(err);
    alert('Failed to load Supplier Outstanding');
  } finally {
    this.getData = false;
  }
}

  openSWAGE() {
      this.swoutData = [];
  this.totalOutstanding = 0;
    this.dialog.open(this.swageLookupDialog, {
      width: '100vw',
      maxWidth: '100vw'
    });
  }

async applySupplierAgeingSummary() {
  if (!this.endDate) {
    alert('Please select end date');
    return;
  }

  this.getData = true;
  this.swoutData = [];
  this.totalOutstanding = 0;

  try {
    const res: any = await firstValueFrom(
      this.reportService.getSupplierAgeingData(this.selectedUnit.id, this.endDate)
    );

    const rows = res.recordset || [];

    /* -----------------------------------------------------------
       1️⃣ FILTER
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
       2️⃣ GROUP BY SUPPLIER + AGEING
    ----------------------------------------------------------- */

    const supplierMap = new Map<string, any>();
    const end = new Date(this.endDate);

    for (const r of uiFiltered) {

      const key = r.CUST_CODE;

      if (!supplierMap.has(key)) {
        supplierMap.set(key, {
          PCODE: r.CUST_CODE,
          CUST_NAME: r.CUST_NAME,
          Nature: r.Nature,
          SupplierCategory: r.SupplierCategory,

          bucket_0_30: 0,
          bucket_31_60: 0,
          bucket_61_90: 0,
          bucket_91_120: 0,
          bucket_120_plus: 0,

          TOTAL: 0
        });
      }

      const s = supplierMap.get(key);

      const trxDate = r.DOC_DATE ? new Date(r.DOC_DATE) : null;
      const amount = Number(r.BALANCE) || 0;

      if (!trxDate) continue;

      const diffDays = Math.floor(
        (end.getTime() - trxDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 30) {
        s.bucket_0_30 += amount;
      } else if (diffDays <= 60) {
        s.bucket_31_60 += amount;
      } else if (diffDays <= 90) {
        s.bucket_61_90 += amount;
      } else if (diffDays <= 120) {
        s.bucket_91_120 += amount;
      } else {
        s.bucket_120_plus += amount;
      }

      s.TOTAL += amount;
    }

    /* -----------------------------------------------------------
       3️⃣ GROUP BY CATEGORY + SUBTOTALS
    ----------------------------------------------------------- */

    const categoryMap = new Map<string, any>();

    for (const s of Array.from(supplierMap.values())) {

      if (s.TOTAL <= 0.001) continue;

      const category = s.SupplierCategory || 'Uncategorized';

      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category: category,
          subtotal: 0,

          bucket_0_30: 0,
          bucket_31_60: 0,
          bucket_61_90: 0,
          bucket_91_120: 0,
          bucket_120_plus: 0,

          suppliers: []
        });
      }

      const group = categoryMap.get(category);

      group.suppliers.push(s);

      // ✅ accumulate subtotals
      group.bucket_0_30 += s.bucket_0_30;
      group.bucket_31_60 += s.bucket_31_60;
      group.bucket_61_90 += s.bucket_61_90;
      group.bucket_91_120 += s.bucket_91_120;
      group.bucket_120_plus += s.bucket_120_plus;

      group.subtotal += s.TOTAL;
    }

    /* -----------------------------------------------------------
       4️⃣ SORT
    ----------------------------------------------------------- */

    const finalData = Array.from(categoryMap.values());

    finalData.sort((a, b) => a.category.localeCompare(b.category));

    finalData.forEach(g => {
      g.suppliers.sort((a: any, b: any) =>
        a.CUST_NAME.localeCompare(b.CUST_NAME)
      );
    });

    /* -----------------------------------------------------------
       5️⃣ FINAL OUTPUT
    ----------------------------------------------------------- */

    this.swoutData = finalData;

    this.totalOutstanding = finalData.reduce(
      (sum, g) => sum + g.subtotal,
      0
    );

  } catch (err) {
    console.error(err);
    alert('Failed to load Supplier Ageing Summary');
  } finally {
    this.getData = false;
  }
}

exportSWOUT(data: any[], file: string) {

  let exportData: any[] = [];

  data.forEach((group: any) => {

    // ✅ CATEGORY HEADER
    exportData.push({
      'Supplier Code': group.category,
      'Supplier Name': '',
      'Nature': '',
      'Category': '',
      'Payment Term': '',
      'Current Outstanding': group.subtotal
    });

    // ✅ SUPPLIER ROWS
    group.suppliers.forEach((s: any) => {
      exportData.push({
        'Supplier Code': s.PCODE,
        'Supplier Name': s.CUST_NAME,
        'Nature': s.Nature,
        'Category': s.SupplierCategory,
        'Payment Term': s.REMARKS,
        'Current Outstanding': s.CURRENT_OUTSTANDING
      });
    });

    // ✅ SUBTOTAL ROW
    exportData.push({
      'Supplier Code': `Subtotal - ${group.category}`,
      'Supplier Name': '',
      'Nature': '',
      'Category': '',
      'Payment Term': '',
      'Current Outstanding': group.subtotal
    });

    // ✅ SPACER
    exportData.push({});
  });

  // ✅ GRAND TOTAL
  exportData.push({
    'Supplier Code': 'GRAND TOTAL',
    'Current Outstanding': this.totalOutstanding
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = { Sheets: { Data: ws }, SheetNames: ['Data'] };

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

  FileSaver.saveAs(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${file}.xlsx`
  );
}

exportSWAGE(data: any[], file: string) {

  let exportData: any[] = [];

  data.forEach((group: any) => {

    // ✅ CATEGORY HEADER
    exportData.push({
      'Supplier Code': group.category,
      'Supplier Name': '',
      '0-30': group.bucket_0_30,
      '31-60': group.bucket_31_60,
      '61-90': group.bucket_61_90,
      '91-120': group.bucket_91_120,
      '120+': group.bucket_120_plus,
      'Total': group.subtotal
    });

    // ✅ SUPPLIERS
    group.suppliers.forEach((s: any) => {

      exportData.push({
        'Supplier Code': s.PCODE,
        'Supplier Name': s.CUST_NAME,
        '0-30': s.bucket_0_30,
        '31-60': s.bucket_31_60,
        '61-90': s.bucket_61_90,
        '91-120': s.bucket_91_120,
        '120+': s.bucket_120_plus,
        'Total': s.TOTAL
      });

    });

    // ✅ SUBTOTAL
    exportData.push({
      'Supplier Code': `Subtotal - ${group.category}`,
      'Supplier Name': '',
      '0-30': group.bucket_0_30,
      '31-60': group.bucket_31_60,
      '61-90': group.bucket_61_90,
      '91-120': group.bucket_91_120,
      '120+': group.bucket_120_plus,
      'Total': group.subtotal
    });

    // ✅ SPACER
    exportData.push({});
  });

  // ✅ GRAND TOTAL
  exportData.push({
    'Supplier Code': 'GRAND TOTAL',
    'Total': this.totalOutstanding
  });

  const ws = XLSX.utils.json_to_sheet(exportData);

  const wb = {
    Sheets: { Data: ws },
    SheetNames: ['Data']
  };

  const buffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array'
  });

  FileSaver.saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }),
    `${file}.xlsx`
  );
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
    doc.text(`As On Date: ${this.formatDate(this.endDate)}`,330,52); 
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

  this.iwtrnlistGroupedData = [];

  this.intermediaryGrandTotals = {
    debit: 0,
    credit: 0,
    balance: 0
  };

  const apiCalls = customer.GLCODES.map((gl: string) =>
    this.reportService.getGLTrnList(
      this.selectedUnit.id,
      gl
    )
  );

  forkJoin(apiCalls).subscribe({

    next: (responses: any) => {

      this.getData = false;

      this.iwtrnlistGroupedData = responses.map((res: any, index: number) => {

        const glcode = customer.GLCODES[index];

        let runningBalance = 0;

        const transactions = (res.recordset || []).map((r: any) => {

          const debit = Number(r.DEBIT_AMT || 0);
          const credit = Math.abs(Number(r.CREDIT_AMT || 0));

          runningBalance += (debit - credit);

          return {
            ...r,
            CREDIT_AMT: credit,
            RUNNING_BALANCE: runningBalance
          };
        });

        const totalDebit = transactions.reduce(
          (sum: number, r: any) => sum + Number(r.DEBIT_AMT || 0),
          0
        );

        const totalCredit = transactions.reduce(
          (sum: number, r: any) => sum + Number(r.CREDIT_AMT || 0),
          0
        );

        const totalBalance = totalDebit - totalCredit;

        this.intermediaryGrandTotals.debit += totalDebit;
        this.intermediaryGrandTotals.credit += totalCredit;
        this.intermediaryGrandTotals.balance += totalBalance;

        return {
          glcode,
          transactions,
          totals: {
            debit: totalDebit,
            credit: totalCredit,
            balance: totalBalance
          }
        };
      });

    },

    error: () => {

      this.getData = false;
      alert('Failed to load GL Transaction Listing');

    }

  });
}

  printIWTRNLIST() {
    var doc = new jsPDF("portrait", "px", "a4");
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Inter-Company Transaction Listing', 150, 20);
    doc.roundedRect(5, 32.5, 436, 55, 5, 5);
    doc.setFontSize(10);
    doc.text(`${this.selectedSupplier.CUST_NAME}`,10,42);
    doc.text(`Account ID: ${this.selectedSupplier.GLCODES}`,330,42);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Date: ${this.mCurDate}`,330,52);
    let firstPageStartY = 60; // Start Y position for first page
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
    doc.save(`${this.selectedSupplier.NAME}-transaction-listing-${this.mCurDate}.pdf`);
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

  this.selectedSupplier = customer;

  this.ipwtrnlistGroupedData = [];

  this.intermediaryGrandTotals = {
    debit: 0,
    credit: 0,
    balance: 0
  };

}

setIPWTRNLIST() {

  if (!this.startDate || !this.endDate) {

    alert('Please select both start and end dates.');
    return;

  }

  const start = new Date(this.startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(this.endDate);
  end.setHours(23, 59, 59, 999);

  this.getData = true;

  this.intermediaryGrandTotals = {
    debit: 0,
    credit: 0,
    balance: 0
  };

  const apiCalls = this.selectedSupplier.GLCODES.map((gl: string) =>
    this.reportService.getGLTrnList(
      this.selectedUnit.id,
      gl
    )
  );

  forkJoin(apiCalls).subscribe({

    next: (responses: any) => {

      this.getData = false;

      this.ipwtrnlistGroupedData = responses.map((res: any, index: number) => {

        const glcode = this.selectedSupplier.GLCODES[index];

        const allRows = res.recordset || [];

        // OPENING ENTRIES
        const openingRows = allRows.filter((row: any) => {

          const txnDate = new Date(row.DOCDATE);
          txnDate.setHours(0,0,0,0);

          return txnDate < start;

        });

        let openingDebit = 0;
        let openingCredit = 0;

        openingRows.forEach((r: any) => {

          openingDebit += Number(r.DEBIT_AMT || 0);
          openingCredit += Math.abs(Number(r.CREDIT_AMT || 0));

        });

        const openingBalance = openingDebit - openingCredit;

        // PERIOD ROWS
        const filteredRows = allRows.filter((row: any) => {

          const txnDate = new Date(row.DOCDATE);

          return txnDate >= start && txnDate <= end;

        });

        let runningBalance = openingBalance;

        const openingRow = {
          DOCDATE: null,
          JOURNALENTRY: '',
          JOURNALREF: 'OPENING BALANCE',
          GLCODE: glcode,
          COMPANYCURRENCY: 'KWD',
          DEBIT_AMT: openingDebit,
          CREDIT_AMT: openingCredit,
          RUNNING_BALANCE: openingBalance,
          IS_OPENING: true
        };

        const transactions = filteredRows.map((r: any) => {

          const debit = Number(r.DEBIT_AMT || 0);
          const credit = Math.abs(Number(r.CREDIT_AMT || 0));

          runningBalance += (debit - credit);

          return {
            ...r,
            CREDIT_AMT: credit,
            RUNNING_BALANCE: runningBalance
          };

        });

        const fullRows = [openingRow, ...transactions];

        const totalDebit = transactions.reduce(
          (sum: number, r: any) => sum + Number(r.DEBIT_AMT || 0),
          0
        );

        const totalCredit = transactions.reduce(
          (sum: number, r: any) => sum + Number(r.CREDIT_AMT || 0),
          0
        );

        const totalBalance = openingBalance + totalDebit - totalCredit;

        this.intermediaryGrandTotals.debit += totalDebit;
        this.intermediaryGrandTotals.credit += totalCredit;
        this.intermediaryGrandTotals.balance += totalBalance;

        return {

          glcode,

          transactions: fullRows,

          totals: {
            debit: totalDebit,
            credit: totalCredit,
            balance: totalBalance
          }

        };

      });

    },

    error: () => {

      this.getData = false;
      alert('Failed to load Period-wise GL Transaction Listing');

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
    doc.text('Inter-Company Transaction Listing', 150, 20);
    doc.roundedRect(5, 32.5, 436, 65, 5, 5);
    doc.setFontSize(10);
    doc.text(`${this.selectedSupplier.CUST_NAME}`,10,42);
    doc.text(`Account ID: ${this.selectedSupplier.GLCODES}`,330,42);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Date: ${this.mCurDate}`,330,52);
    doc.text('Period',10,52);
    doc.text(`: ${this.formatDate(this.startDate)} - ${this.formatDate(this.endDate)}`, 45, 52)
    let firstPageStartY = 60; // Start Y position for first page
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
    doc.save(`${this.selectedSupplier.NAME}-transaction-listing-${this.mCurDate}-period-${this.startDate}-${this.endDate}.pdf`);
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
    this.iwtrnlistGroupedData = [];
    this.ipwtrnlistGroupedData = [];
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

  exportGroupedTable(data: any[], file: string) {

  let exportData: any[] = [];

  // GROUPED DATA EXPORT
  if (data.length > 0 && data[0].transactions) {

    data.forEach((group: any) => {

      // GROUP HEADER
      exportData.push({
        'GL Account': group.glcode,
        'Transaction Date': '',
       // 'Transaction No': '',
       // 'Reference': '',
        'Description': '',
        'Currency': '',
        'Debit': '',
        'Credit': '',
        'Balance': ''
      });

      // TRANSACTIONS
      group.transactions.forEach((row: any) => {

        exportData.push({
          'GL Account': row.GLCODE,
          'Transaction Date': row.DOCDATE
            ? new Date(row.DOCDATE).toLocaleDateString('en-GB')
            : '',

        //  'Transaction No': row.JOURNALENTRY || '',
        //  'Reference': row.JOURNALREF || '',
          'Description': row.JOURNALREF || '',
          'Currency': row.COMPANYCURRENCY || '',

          'Debit': row.DEBIT_AMT || 0,
          'Credit': row.CREDIT_AMT || 0,
          'Balance': row.RUNNING_BALANCE || row.BALANCE || 0
        });

      });

      // SUBTOTAL ROW
      exportData.push({
        'GL Account': `Subtotal for ${group.glcode}`,
        'Transaction Date': '',
      //  'Transaction No': '',
      //  'Reference': '',
        'Description': '',
        'Currency': '',

        'Debit': group.totals.debit,
        'Credit': group.totals.credit,
        'Balance': group.totals.balance
      });

      // EMPTY SPACER ROW
      exportData.push({});

    });

    // GRAND TOTAL
    exportData.push({
      'GL Account': 'GRAND TOTAL',
      'Transaction Date': '',
   //   'Transaction No': '',
    //  'Reference': '',
      'Description': '',
      'Currency': '',

      'Debit': this.intermediaryGrandTotals.debit,
      'Credit': this.intermediaryGrandTotals.credit,
      'Balance': this.intermediaryGrandTotals.balance
    });

  }

  // NORMAL ARRAY EXPORT
  else {

    exportData = data;

  }

  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

  const wb: XLSX.WorkBook = {
    Sheets: { Data: ws },
    SheetNames: ['Data']
  };

  const buffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array'
  });

  FileSaver.saveAs(
    new Blob(
      [buffer],
      {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    ),
    `${file}.xlsx`
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