import { Component, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountsService } from 'src/app/services/accounts/accounts.service';
import { DataSharingService } from 'src/app/services/data-sharing/data-sharing.service';
import { FinanceService } from 'src/app/services/finance/finance.service';
import { ReportsService } from 'src/app/services/reports/reports.service';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { SapService } from 'src/app/services/SAP/sap.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { EmailService } from 'src/app/services/email/email.service';
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

  userRight = localStorage.getItem('userright')!
  loggedInUser = this.removeQuotes(localStorage.getItem('firstname')?.trim() || 'Guest') + ' ' + this.removeQuotes(localStorage.getItem('lastname')?.trim() || '');  

  @ViewChild('swsoaLookupDialog', { static: false }) swsoaLookupDialog!: TemplateRef<any>;
  @ViewChild('spwsoaLookupDialog', { static: false }) spwsoaLookupDialog!: TemplateRef<any>;
  @ViewChild('ipwsoaLookupDialog', { static: false }) ipwsoaLookupDialog!: TemplateRef<any>;
  @ViewChild('swoutLookupDialog', { static: false }) swoutLookupDialog!: TemplateRef<any>;
  @ViewChild('iwoutLookupDialog', { static: false }) iwoutLookupDialog!: TemplateRef<any>;
  @ViewChild('swtrnlistLookupDialog', { static: false }) swtrnlistLookupDialog!: TemplateRef<any>;
  @ViewChild('spwtrnlistLookupDialog', { static: false }) spwtrnlistLookupDialog!: TemplateRef<any>;
  @ViewChild('swtrnsumLookupDialog', { static: false }) swtrnsumLookupDialog!: TemplateRef<any>;

  currentYear = new Date().getFullYear()
  mCurDate = this.formatDate(new Date())
  
  swsoaData: any[] = []
  spwsoaData: any[] = []
  ipwsoaData: any[] = []
  swoutData: any[] = []
  iwoutData: any[] = []
  swtrnlistData: any[] = []
  spwtrnlistData: any[] = []
  swtrnsumData: any[] = []

  periodTotalDebit = 0;
  periodTotalCredit = 0;
  periodClosingBalance = 0;
  periodAgeingSummary = {
    '30_DAYS': 0,
    '60_DAYS': 0,
    '90_DAYS': 0,
    '120_DAYS': 0,
    'ABOVE_120_DAYS': 0,
    'CURRENT': 0
  };
  openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
  totalDebit = 0;
  totalCredit = 0;
  openingBalance = 0;
  closingBalance = 0;

  selectedSupplier: any

    /*countries = [
    { name: 'All Countries', code: 'un' },
    { name: 'Bahrain', code: 'bh' },
    { name: 'Kuwait', code: 'kw' },
    { name: 'Saudi Arabia', code: 'sa' },
    { name: 'United Arab Emirates', code: 'ae' },
    { name: 'Oman', code: 'om' },
    { name: 'Qatar', code: 'qa' },
  ];

  selectedCountry: { name: string; code: string } = this.countries[0];
  selectedCountryName = '*';
  selectedCountryCode = 'un';*/

  salesUnits: { id: string; name: string; code: string, country: string }[] = [];
  selectedUnit!: { id: string; name: string; code: string, country: string };
  selectedCountryCode = 'un';

  supplierList: any[] = [];          // full supplier master list
  filteredSuppliers: any[] = [];     // filtered by nature/category/search
  searchText: string = '';
  natureList: any[] = [];
  categoryList: any[] = [];
  selectedNature: string = '';
  selectedCategory: string = '';
  getData: boolean = false;

  intermediariesList: any[] = [];      

  totalOutstanding: number = 0;

  startDate: Date;
  endDate: Date;

  ageingSummary = {
    '30_DAYS': 0,
    '60_DAYS': 0,
    '90_DAYS': 0,
    '120_DAYS': 0,
    'ABOVE_120_DAYS': 0,
    'CURRENT': 0
  };

  constructor(private financeService: FinanceService, private route: ActivatedRoute, private dialog: MatDialog, private router: Router, private accountService: AccountsService, private reportService: ReportsService, private dataSharingService: DataSharingService, private sapservice: SapService, private emailService: EmailService) { 
    this.accountService.listOpbal(this.currentYear.toString(),'S').subscribe((res: any) => {
      console.log(res)
      this.supplierList = res.recordset;
    }, (error: any) => {
      console.log(error);
    });
    this.accountService.listOpbal(this.currentYear.toString(),'G').subscribe((res: any) => {
      console.log(res)
      this.intermediariesList = res.recordset;
    }, (error: any) => {
      console.log(error);
    });
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
  this.reportService.getSalesUnits().subscribe(
    (res: any) => {
      const data = res.recordset.filter((u: any) => u.salesunitname);

      this.salesUnits = [
        { id: '*', name: 'All Units', code: 'un' },
        ...data.map((unit: any) => ({
          id: unit.salesunitID,
          name: unit.salesunitname,
          code: this.mapFlagCode(unit.salesunitname),
          country: this.mapCountry(unit.salesunitname),
        }))
      ];

      this.selectedUnit = this.salesUnits[0];
    },
    (err: any) => console.log(err)
  );
}

mapCountry(name: string): string {
  if (name.includes('Kuwait')) return 'Kuwait';
  if (name.includes('KSA') || name.includes('Saudi')) return 'Saudi Arabia';
  if (name.includes('Bahrain')) return 'Bahrain';
  if (name.includes('UAE')) return 'United Arab Emirates';
  if (name.includes('Oman')) return 'Oman';
  if (name.includes('Qatar')) return 'Qatar';

  return 'un'; // fallback
}

mapFlagCode(name: string): string {
  if (name.includes('Kuwait')) return 'kw';
  if (name.includes('KSA') || name.includes('Saudi')) return 'sa';
  if (name.includes('Bahrain')) return 'bh';
  if (name.includes('UAE')) return 'ae';
  if (name.includes('Oman')) return 'om';
  if (name.includes('Qatar')) return 'qa';

  return 'un'; // fallback
}

updateUnit(unit: { id: string; name: string; code: string, country: string }) {

  this.selectedUnit = unit;
  this.selectedCountryCode = unit.code;

  /*const compcode = unit.id;

  if (compcode === '*') {
    this.reportService.getParent('*', 'C').subscribe(
      (res: any) => {
        this.parentList = res.recordset;
      },
      (err: any) => console.log(err)
    );
  } else {
    this.reportService.getParent(unit.country, 'C').subscribe(
      (res: any) => {
        this.parentList = res.recordset;
      },
      (err: any) => console.log(err)
    );
  }*/
}

  ngOnInit() {
      this.loadSalesUnits();
  }

  openSWSOA() {
    //let dialogRef = this.dialog.open(this.cwsoaLookupDialog);
    this.dialog.open(this.swsoaLookupDialog, {
        width: '100vw',
        maxWidth: '100vw',
    }
  )
    this.periodTotalDebit = 0;
  this.periodTotalCredit = 0;
  this.periodClosingBalance = 0;
  this.periodAgeingSummary = {
    '30_DAYS': 0,
    '60_DAYS': 0,
    '90_DAYS': 0,
    '120_DAYS': 0,
    'ABOVE_120_DAYS': 0,
    'CURRENT': 0
  };
  this.openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
  this.totalDebit = 0;
  this.totalCredit = 0;
  this.openingBalance = 0;
  this.closingBalance = 0;
    this.swsoaData = []
  }

getSWSOA(customer: any) {
      this.periodTotalDebit = 0;
  this.periodTotalCredit = 0;
  this.periodClosingBalance = 0;
  this.periodAgeingSummary = {
    '30_DAYS': 0,
    '60_DAYS': 0,
    '90_DAYS': 0,
    '120_DAYS': 0,
    'ABOVE_120_DAYS': 0,
    'CURRENT': 0
  };
  this.openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
  this.totalDebit = 0;
  this.totalCredit = 0;
  this.openingBalance = 0;
  this.closingBalance = 0;
  this.swsoaData = [];
  this.selectedSupplier = customer;
  this.getData = true;

  this.reportService.getApCustomerSoa(this.selectedUnit.id,'S', customer.PCODE).subscribe((res: any) => {
    console.log(res.recordset)
    this.getData = false;
    if (res.recordset.length === 0) {
      alert('No data for the selected parameters!');
      return;
    }

    const today = new Date(); 
    today.setHours(0, 0, 0, 0);

    this.swsoaData = res.recordset;
          this.getData = false
      let runningBalance = 0;

      this.swsoaData = this.swsoaData.map(row => {
        const debit = Number(row.CREDIT ) || 0;
        const credit = Number(row.DEBIT ) || 0;
        this.totalDebit += debit;
        this.totalCredit += credit;

        runningBalance += debit - credit;

        let daysDiff: number | null = null;

          const dueDate = new Date(row.DUEDATE);
          const today = new Date();

          dueDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);

          const diffTime = today.getTime() - dueDate.getTime()
          daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));    
        
        return {
          ...row,
          BALANCE: runningBalance,
          DAYS_DIFF: daysDiff // could be null if not applicable
        };
      });

    const result = this.applySupplierFifoAndAgeing(res.recordset,today);

    this.ageingSummary = result.ageing;
    this.closingBalance = result.totalBalance;
  }, (err: any) => {
    alert('No data for the selected parameters!');
    this.getData = false;
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

  exportSWSOA(): void {
    const fileName = `${this.selectedSupplier.PCODE}-statement-of-accounts-${this.mCurDate}.xlsx`;

    // 1. Create worksheet from cwsoaData
    const cwsoaSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.swsoaData.map(row => ({
      'Invoice Date': row.INV_DATE ? new Date(row.INV_DATE).toLocaleDateString() : '',
      'Invoice No': row.INV_NO,
      'Reference': row.INV_NO === row.REMARKS ? '' : row.REMARKS,
      'Description': row.DESCRIPTION,
      'Due Date': row.DUEDATE ? new Date(row.DUEDATE).toLocaleDateString() : '',
      'Currency': row.JOB,
      'Debit': row.CREDIT  || '',
      'Credit': row.DEBIT  || '',
      'Balance': row.BALANCE
    })));

    // 2. Create another sheet for Ageing Summary
    const ageingData = [{
      'Current': this.ageingSummary['CURRENT'] || 0,
      '0 - 30 days': this.ageingSummary['30_DAYS'] || 0,
      '31 - 60 days': this.ageingSummary['60_DAYS'] || 0,
      '61 - 90 days': this.ageingSummary['90_DAYS'] || 0,
      '91 - 120 days': this.ageingSummary['120_DAYS'] || 0,
      'Above 120 days': this.ageingSummary['ABOVE_120_DAYS'] || 0,
      'Total Outstanding': (
        (this.ageingSummary['CURRENT'] || 0) +
        (this.ageingSummary['30_DAYS'] || 0) +
        (this.ageingSummary['60_DAYS'] || 0) +
        (this.ageingSummary['90_DAYS'] || 0) +
        (this.ageingSummary['120_DAYS'] || 0) +
        (this.ageingSummary['ABOVE_120_DAYS'] || 0)
      )
    }];

    const ageingSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(ageingData);

    // 3. Create a workbook and add the sheets
    const workbook: XLSX.WorkBook = {
      Sheets: {
        'Statement': cwsoaSheet,
        'Ageing Summary': ageingSheet
      },
      SheetNames: ['Statement', 'Ageing Summary']
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

  openSPWSOA() {
    //let dialogRef = this.dialog.open(this.spwsoaLookupDialog);
    this.dialog.open(this.spwsoaLookupDialog, {
        width: '100vw',
        maxWidth: '100vw',
    }
  )
        this.periodTotalDebit = 0;
  this.periodTotalCredit = 0;
  this.periodClosingBalance = 0;
  this.periodAgeingSummary = {
    '30_DAYS': 0,
    '60_DAYS': 0,
    '90_DAYS': 0,
    '120_DAYS': 0,
    'ABOVE_120_DAYS': 0,
    'CURRENT': 0
  };
  this.openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
  this.totalDebit = 0;
  this.totalCredit = 0;
  this.openingBalance = 0;
  this.closingBalance = 0;
    this.spwsoaData = []
  }

  getSPWSOA(customer: any) {
    this.spwsoaData = []
        this.periodTotalDebit = 0;
  this.periodTotalCredit = 0;
  this.periodClosingBalance = 0;
  this.periodAgeingSummary = {
    '30_DAYS': 0,
    '60_DAYS': 0,
    '90_DAYS': 0,
    '120_DAYS': 0,
    'ABOVE_120_DAYS': 0,
    'CURRENT': 0
  };
  this.openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
  this.totalDebit = 0;
  this.totalCredit = 0;
  this.openingBalance = 0;
  this.closingBalance = 0;
    this.selectedSupplier = customer
  }

setSPWSOA() {
  if (!this.startDate || !this.endDate) {
    alert('Please select both start and end dates.');
    return;
  }
      this.periodTotalDebit = 0;
  this.periodTotalCredit = 0;
  this.periodClosingBalance = 0;
  this.periodAgeingSummary = {
    '30_DAYS': 0,
    '60_DAYS': 0,
    '90_DAYS': 0,
    '120_DAYS': 0,
    'ABOVE_120_DAYS': 0,
    'CURRENT': 0
  };
  this.openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
  this.totalDebit = 0;
  this.totalCredit = 0;
  this.openingBalance = 0;
  this.closingBalance = 0;

  const start = new Date(this.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(this.endDate);
  end.setHours(23, 59, 59, 999);

  this.getData = true;

  this.reportService.getApCustomerSoa(this.selectedUnit.id,'S', this.selectedSupplier.PCODE).subscribe((res: any) => {
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
      '120_DAYS': 0,
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

  openingData.forEach((row: any) => {
    const debit = Number(row.CREDIT );
    const credit = Number(row.DEBIT );
    this.openingBalanceData.DEBIT += credit;
    this.openingBalanceData.CREDIT += debit;
    this.openingBalanceData.BALANCE += (debit - credit);
  });

    // Filter transactions in selected period
var filteredPeriodRows = data.filter((row: any) => {
  const txnDate = new Date(row.INV_DATE)
  return txnDate >= start && txnDate <= end
})

  for(let i=0; i<filteredPeriodRows.length; i++){
    const debit = Number(filteredPeriodRows[i].CREDIT) || 0;
    const credit = Number(filteredPeriodRows[i].DEBIT) || 0;

    this.periodTotalDebit += debit;
    this.periodTotalCredit += credit;
  }

// Build opening balance row
const openingRow = {
  INV_NO: 'OPENING BALANCE',
  INV_DATE: null,
  DEBIT: this.openingBalanceData.DEBIT,
  CREDIT: this.openingBalanceData.CREDIT,
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
      const debit = Number(row.CREDIT ) || 0;
      const credit = Number(row.DEBIT ) || 0;

      periodRunningBalance += debit - credit;

      return {
        ...row,
        BALANCE: periodRunningBalance
      };
    });

    // Combine into final list
this.spwsoaData = [openingRow, ...filteredPeriodRows]


    // 🔹 Apply FIFO + ageing on period data
const fifoInput = filteredPeriodRows;
const result = this.applySupplierFifoAndAgeing(fifoInput, this.endDate);

    this.ageingSummary = result.ageing;
    this.closingBalance = this.openingBalanceData.BALANCE + result.totalBalance;

  }, (err: any) => {
    this.getData = false;
    alert('No data for the selected parameters!');
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

  exportSPWSOA(): void {
    const fileName = `${this.selectedSupplier.PCODE}-statement-of-accounts-${this.mCurDate}-period-${this.startDate}-${this.endDate}.xlsx`;

    // 1. Create worksheet from spwsoaData
    const spwsoaSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.spwsoaData.map(row => ({
      'Invoice Date': row.INV_DATE ? new Date(row.INV_DATE).toLocaleDateString() : '',
      'Invoice No': row.INV_NO,
      'Reference': row.INV_NO === row.REMARKS ? '' : row.REMARKS,
      'Description': row.DESCRIPTION,
      'Due Date': row.DUEDATE ? new Date(row.DUEDATE).toLocaleDateString() : '',
      'Debit': row.CREDIT  || '',
      'Credit': row.DEBIT  || '',
      'Balance': row.BALANCE
    })));

    // 2. Create another sheet for Ageing Summary
    const ageingData = [{
      'Current': this.periodAgeingSummary['CURRENT'] || 0,
      '0 - 30 days': this.periodAgeingSummary['30_DAYS'] || 0,
      '31 - 60 days': this.periodAgeingSummary['60_DAYS'] || 0,
      '61 - 90 days': this.periodAgeingSummary['90_DAYS'] || 0,
      '91 - 120 days': this.periodAgeingSummary['120_DAYS'] || 0,
      'Above 120 days': this.periodAgeingSummary['ABOVE_120_DAYS'] || 0,
      'Total Outstanding': (
        (this.periodAgeingSummary['CURRENT'] || 0) +
        (this.periodAgeingSummary['30_DAYS'] || 0) +
        (this.periodAgeingSummary['60_DAYS'] || 0) +
        (this.periodAgeingSummary['90_DAYS'] || 0) +
        (this.periodAgeingSummary['120_DAYS'] || 0) +
        (this.periodAgeingSummary['ABOVE_120_DAYS'] || 0)
      )
    }];

    const ageingSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(ageingData);

    // 3. Create a workbook and add the sheets
    const workbook: XLSX.WorkBook = {
      Sheets: {
        'Statement': spwsoaSheet,
        'Ageing Summary': ageingSheet
      },
      SheetNames: ['Statement', 'Ageing Summary']
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

  openSWOUT() {
    this.dialog.open(this.swoutLookupDialog, {
      width: '100vw',
      maxWidth: '100vw'
    });
    this.loadSuppliers();
  }

  // --- LOAD SUPPLIERS ---
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
      
      const outstanding = await this.computeOutstanding(supplier.PCODE, this.endDate ? new Date(this.endDate) : new Date(), 'S');
      
      return {
        ...supplier,
        CURRENT_OUTSTANDING: outstanding
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

    exportSWOUT() {
    const fileName = `SupplierOutstanding-ason-${this.formatDate(this.endDate)}-${this.formatDate(new Date())}.xlsx`;
    const sheetData = this.swoutData.map(s => ({
      'Supplier Code': s.PCODE,
      'Supplier Name': s.CUST_NAME,
      'Nature': s.Nature,
      'Category': s.SupplierCategory,
      'Payment Term': s.REMARKS || '',
      'Current Outstanding': s.CURRENT_OUTSTANDING?.toFixed(3) || '0.000'
    }));
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook: XLSX.WorkBook = { Sheets: { 'SupplierOutstanding': worksheet }, SheetNames: ['SupplierOutstanding'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    FileSaver.saveAs(blob, fileName);
  }


  openIPWSOA() {
    //let dialogRef = this.dialog.open(this.spwsoaLookupDialog);
    this.dialog.open(this.ipwsoaLookupDialog, {
        width: '100vw',
        maxWidth: '100vw',
    }
  )
        this.periodTotalDebit = 0;
  this.periodTotalCredit = 0;
  this.periodClosingBalance = 0;
  this.periodAgeingSummary = {
    '30_DAYS': 0,
    '60_DAYS': 0,
    '90_DAYS': 0,
    '120_DAYS': 0,
    'ABOVE_120_DAYS': 0,
    'CURRENT': 0
  };
  this.openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
  this.totalDebit = 0;
  this.totalCredit = 0;
  this.openingBalance = 0;
  this.closingBalance = 0;
    this.ipwsoaData = []
  }

  getIPWSOA(customer: any) {
    this.ipwsoaData = []
        this.periodTotalDebit = 0;
  this.periodTotalCredit = 0;
  this.periodClosingBalance = 0;
  this.periodAgeingSummary = {
    '30_DAYS': 0,
    '60_DAYS': 0,
    '90_DAYS': 0,
    '120_DAYS': 0,
    'ABOVE_120_DAYS': 0,
    'CURRENT': 0
  };
  this.openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
  this.totalDebit = 0;
  this.totalCredit = 0;
  this.openingBalance = 0;
  this.closingBalance = 0;
    this.selectedSupplier = customer
  }

setIPWSOA() {
  if (!this.startDate || !this.endDate) {
    alert('Please select both start and end dates.');
    return;
  }
      this.periodTotalDebit = 0;
  this.periodTotalCredit = 0;
  this.periodClosingBalance = 0;
  this.periodAgeingSummary = {
    '30_DAYS': 0,
    '60_DAYS': 0,
    '90_DAYS': 0,
    '120_DAYS': 0,
    'ABOVE_120_DAYS': 0,
    'CURRENT': 0
  };
  this.openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
  this.totalDebit = 0;
  this.totalCredit = 0;
  this.openingBalance = 0;
  this.closingBalance = 0;

  const start = new Date(this.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(this.endDate);
  end.setHours(23, 59, 59, 999);

  this.getData = true;

  this.reportService.getApCustomerSoa(this.selectedUnit.id,'G', this.selectedSupplier.PCODE).subscribe((res: any) => {
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
      '120_DAYS': 0,
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

  openingData.forEach((row: any) => {
    const debit = Number(row.CREDIT );
    const credit = Number(row.DEBIT );
    this.openingBalanceData.DEBIT += credit;
    this.openingBalanceData.CREDIT += debit;
    this.openingBalanceData.BALANCE += (debit - credit);
  });

    // Filter transactions in selected period
var filteredPeriodRows = data.filter((row: any) => {
  const txnDate = new Date(row.INV_DATE)
  return txnDate >= start && txnDate <= end
})

  for(let i=0; i<filteredPeriodRows.length; i++){
    const debit = Number(filteredPeriodRows[i].CREDIT) || 0;
    const credit = Number(filteredPeriodRows[i].DEBIT) || 0;

    this.periodTotalDebit += debit;
    this.periodTotalCredit += credit;
  }

// Build opening balance row
const openingRow = {
  INV_NO: 'OPENING BALANCE',
  INV_DATE: null,
  DEBIT: this.openingBalanceData.DEBIT,
  CREDIT: this.openingBalanceData.CREDIT,
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
      const debit = Number(row.CREDIT ) || 0;
      const credit = Number(row.DEBIT ) || 0;

      periodRunningBalance += debit - credit;

      return {
        ...row,
        BALANCE: periodRunningBalance
      };
    });

    // Combine into final list
this.ipwsoaData = [openingRow, ...filteredPeriodRows]


    // 🔹 Apply FIFO + ageing on period data
const fifoInput = filteredPeriodRows;
const result = this.applySupplierFifoAndAgeing(fifoInput, this.endDate);

    this.ageingSummary = result.ageing;
    this.closingBalance = this.openingBalanceData.BALANCE + result.totalBalance;

  }, (err: any) => {
    this.getData = false;
    alert('No data for the selected parameters!');
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

  exportIPWSOA(): void {
    const fileName = `${this.selectedSupplier.PCODE}-statement-of-account-${this.mCurDate}-period-${this.startDate}-${this.endDate}.xlsx`;

    // 1. Create worksheet from spwsoaData
    const ipwsoaSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.ipwsoaData.map(row => ({
      'Invoice Date': row.INV_DATE ? new Date(row.INV_DATE).toLocaleDateString() : '',
      'Invoice No': row.INV_NO,
      'Reference': row.INV_NO === row.REMARKS ? '' : row.REMARKS,
      'Description': row.DESCRIPTION,
      'Due Date': row.DUEDATE ? new Date(row.DUEDATE).toLocaleDateString() : '',
      'Debit': row.CREDIT  || '',
      'Credit': row.DEBIT  || '',
      'Balance': row.BALANCE
    })));

    // 2. Create another sheet for Ageing Summary
    const ageingData = [{
      'Current': this.periodAgeingSummary['CURRENT'] || 0,
      '0 - 30 days': this.periodAgeingSummary['30_DAYS'] || 0,
      '31 - 60 days': this.periodAgeingSummary['60_DAYS'] || 0,
      '61 - 90 days': this.periodAgeingSummary['90_DAYS'] || 0,
      '91 - 120 days': this.periodAgeingSummary['120_DAYS'] || 0,
      'Above 120 days': this.periodAgeingSummary['ABOVE_120_DAYS'] || 0,
      'Total Outstanding': (
        (this.periodAgeingSummary['CURRENT'] || 0) +
        (this.periodAgeingSummary['30_DAYS'] || 0) +
        (this.periodAgeingSummary['60_DAYS'] || 0) +
        (this.periodAgeingSummary['90_DAYS'] || 0) +
        (this.periodAgeingSummary['120_DAYS'] || 0) +
        (this.periodAgeingSummary['ABOVE_120_DAYS'] || 0)
      )
    }];

    const ageingSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(ageingData);

    // 3. Create a workbook and add the sheets
    const workbook: XLSX.WorkBook = {
      Sheets: {
        'Statement': ipwsoaSheet,
        'Ageing Summary': ageingSheet
      },
      SheetNames: ['Statement', 'Ageing Summary']
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


  openIWOUT() {
    this.dialog.open(this.iwoutLookupDialog, {
      width: '100vw',
      maxWidth: '100vw'
    });
    this.loadIntermedaries();
  }

  // --- LOAD SUPPLIERS ---
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

    exportIWOUT() {
    const fileName = `SupplierOutstanding-ason-${this.formatDate(this.endDate)}-${this.formatDate(new Date())}.xlsx`;
    const sheetData = this.iwoutData.map(s => ({
      'Supplier Code': s.PCODE,
      'Supplier Name': s.CUST_NAME,
      'Nature': s.Nature,
      'Category': s.SupplierCategory,
      'Payment Term': s.REMARKS || '',
      'Current Outstanding': s.CURRENT_OUTSTANDING?.toFixed(3) || '0.000'
    }));
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook: XLSX.WorkBook = { Sheets: { 'SupplierOutstanding': worksheet }, SheetNames: ['SupplierOutstanding'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    FileSaver.saveAs(blob, fileName);
  }

private applySupplierFifoAndAgeing(data: any[], endDate: Date) {

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const today = new Date(endDate);
  today.setHours(0, 0, 0, 0);

  const invoices: any[] = [];
  const payments: any[] = [];

  // 🔹 Filter transactions up to end date
  const filtered = data.filter(row => {
    if (!row.INV_DATE) return false;

    const txnDate = new Date(row.INV_DATE);
    txnDate.setHours(0, 0, 0, 0);

    return txnDate <= end;
  });

  // 🔹 Separate invoices and payments
  filtered.forEach(row => {

    const invoice = Number(row.CREDIT ?? 0);
    const payment = Number(row.DEBIT ?? 0);

    if (invoice > 0 && payment === 0) {
      invoices.push({
        ...row,
        original: invoice,
        remaining: invoice,
        applied: 0
      });
    }

    if (payment > 0 && invoice === 0) {
      payments.push({
        ...row,
        remaining: payment
      });
    }

  });

  // 🔹 Sort FIFO
  invoices.sort(
    (a, b) => new Date(a.INV_DATE).getTime() - new Date(b.INV_DATE).getTime()
  );

  payments.sort(
    (a, b) => new Date(a.INV_DATE).getTime() - new Date(b.INV_DATE).getTime()
  );

  // 🔹 Apply payments to invoices (FIFO)
  payments.forEach(payment => {

    let remainingPayment = payment.remaining;

    for (const invoice of invoices) {

      if (remainingPayment <= 0) break;
      if (invoice.remaining <= 0) continue;

      const appliedAmount = Math.min(invoice.remaining, remainingPayment);

      invoice.remaining -= appliedAmount;
      invoice.applied += appliedAmount;

      remainingPayment -= appliedAmount;

    }

    payment.remaining = remainingPayment;

  });

  // 🔹 Ageing buckets
  const ageing = {
    CURRENT: 0,
    '30_DAYS': 0,
    '60_DAYS': 0,
    '90_DAYS': 0,
    '120_DAYS': 0,
    'ABOVE_120_DAYS': 0
  };

  const resultRows: any[] = [];
  let runningBalance = 0;

  invoices.forEach(row => {

    const amt = Number(row.remaining ?? 0);
    if (amt <= 0) return;

    runningBalance += amt;

    let daysDiff = 0;

    const dueBase = row.DUEDATE ? new Date(row.DUEDATE) : new Date(row.INV_DATE);
    dueBase.setHours(0, 0, 0, 0);

    daysDiff = Math.floor(
      (today.getTime() - dueBase.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff < 0) {
      ageing.CURRENT += amt;
    } else if (daysDiff <= 30) {
      ageing['30_DAYS'] += amt;
    } else if (daysDiff <= 60) {
      ageing['60_DAYS'] += amt;
    } else if (daysDiff <= 90) {
      ageing['90_DAYS'] += amt;
    } else if (daysDiff <= 120) {
      ageing['120_DAYS'] += amt;
    } else {
      ageing['ABOVE_120_DAYS'] += amt;
    }

    resultRows.push({
      ...row,
      OUTSTANDING: amt,
      BALANCE: runningBalance,
      DAYS_DIFF: daysDiff
    });

  });

  // 🔹 Capture unapplied payments
  const unappliedPayments = payments.reduce(
    (sum, p) => sum + (Number(p.remaining) || 0),
    0
  );

  return {
    rows: resultRows,
    ageing,
    totalBalance: runningBalance,
    unappliedPayments
  };
}


  openSWTRNLIST() {
    //let dialogRef = this.dialog.open(this.cwsoaLookupDialog);
    this.dialog.open(this.swtrnlistLookupDialog, {
        width: '100vw',
        maxWidth: '100vw',
    }
  )
    this.periodTotalDebit = 0;
  this.periodTotalCredit = 0;
  this.periodClosingBalance = 0;
  this.periodAgeingSummary = {
    '30_DAYS': 0,
    '60_DAYS': 0,
    '90_DAYS': 0,
    '120_DAYS': 0,
    'ABOVE_120_DAYS': 0,
    'CURRENT': 0
  };
  this.openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
  this.totalDebit = 0;
  this.totalCredit = 0;
  this.openingBalance = 0;
  this.closingBalance = 0;
    this.swtrnlistData = []
  }

getSWTRNLIST(customer: any) {
      this.periodTotalDebit = 0;
  this.periodTotalCredit = 0;
  this.periodClosingBalance = 0;
  this.periodAgeingSummary = {
    '30_DAYS': 0,
    '60_DAYS': 0,
    '90_DAYS': 0,
    '120_DAYS': 0,
    'ABOVE_120_DAYS': 0,
    'CURRENT': 0
  };
  this.openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
  this.totalDebit = 0;
  this.totalCredit = 0;
  this.openingBalance = 0;
  this.closingBalance = 0;
  this.swtrnlistData = [];
  this.selectedSupplier = customer;
  this.getData = true;

  this.reportService.getApCustomerTrnList(this.selectedUnit.id,'S', customer.PCODE).subscribe((res: any) => {
    console.log(res.recordset)
    this.getData = false;
    if (res.recordset.length === 0) {
      alert('No data for the selected parameters!');
      return;
    }

    const today = new Date(); 
    today.setHours(0, 0, 0, 0);

    this.swtrnlistData = res.recordset;
          this.getData = false
      let runningBalance = 0;

      this.swtrnlistData = this.swtrnlistData.map(row => {
        const debit = Number(row.REFAMOUNT ) || 0;
        const credit = Number(row.INV_AMOUNT ) || 0;
        this.totalDebit += debit;
        this.totalCredit += credit;

        runningBalance += debit - credit;

        let daysDiff: number | null = null;

          const dueDate = new Date(row.DUEDATE);
          const today = new Date();

          dueDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);

          const diffTime = today.getTime() - dueDate.getTime()
          daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));    
        
        return {
          ...row,
          BALANCE: runningBalance,
          DAYS_DIFF: daysDiff // could be null if not applicable
        };
      });

    //const result = this.applySupplierFifoAndAgeing(res.recordset,today);

   // this.ageingSummary = result.ageing;
    //this.closingBalance = result.totalBalance;
  }, (err: any) => {
    alert('No data for the selected parameters!');
    this.getData = false;
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

    /*let finalY1 = doc.lastAutoTable?.finalY || 0
    autoTable(doc, {
      html: '#swTrnListAgeingSummaryTable',
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
    //});

    // Add watermark (if necessary)
    doc = this.addWaterMark(doc,'p');
    // Save the PDF
    doc.save(`${this.selectedSupplier.PCODE}-transaction-listing-${this.mCurDate}.pdf`);
  }

  exportSWTRNLIST(): void {
    const fileName = `${this.selectedSupplier.PCODE}-transaction-listing-${this.mCurDate}.xlsx`;

    // 1. Create worksheet from cwsoaData
    const cwsoaSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.swtrnlistData.map(row => ({
      'Invoice Date': row.INV_DATE ? new Date(row.INV_DATE).toLocaleDateString() : '',
      'Invoice No': row.INV_NO,
      'Reference': row.INV_NO === row.REMARKS ? '' : row.REMARKS,
      'Description': row.DESCRIPTION,
      'Due Date': row.DUEDATE ? new Date(row.DUEDATE).toLocaleDateString() : '',
      'Currency': row.JOB,
      'Debit': row.REFAMOUNT  || '',
      'Credit': row.INV_AMOUNT  || '',
      'Balance': row.BALANCE
    })));

    // 2. Create another sheet for Ageing Summary
    /*const ageingData = [{
      'Current': this.ageingSummary['CURRENT'] || 0,
      '0 - 30 days': this.ageingSummary['30_DAYS'] || 0,
      '31 - 60 days': this.ageingSummary['60_DAYS'] || 0,
      '61 - 90 days': this.ageingSummary['90_DAYS'] || 0,
      '91 - 120 days': this.ageingSummary['120_DAYS'] || 0,
      'Above 120 days': this.ageingSummary['ABOVE_120_DAYS'] || 0,
      'Total Outstanding': (
        (this.ageingSummary['CURRENT'] || 0) +
        (this.ageingSummary['30_DAYS'] || 0) +
        (this.ageingSummary['60_DAYS'] || 0) +
        (this.ageingSummary['90_DAYS'] || 0) +
        (this.ageingSummary['120_DAYS'] || 0) +
        (this.ageingSummary['ABOVE_120_DAYS'] || 0)
      )
    }];

    const ageingSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(ageingData);*/

    // 3. Create a workbook and add the sheets
    const workbook: XLSX.WorkBook = {
      Sheets: {
        'Statement': cwsoaSheet,
        //'Ageing Summary': ageingSheet
      },
      SheetNames: ['Statement']//, 'Ageing Summary']
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

    openSPWTRNLIST() {
    //let dialogRef = this.dialog.open(this.spwsoaLookupDialog);
    this.dialog.open(this.spwtrnlistLookupDialog, {
        width: '100vw',
        maxWidth: '100vw',
    }
  )
        this.periodTotalDebit = 0;
  this.periodTotalCredit = 0;
  this.periodClosingBalance = 0;
  this.periodAgeingSummary = {
    '30_DAYS': 0,
    '60_DAYS': 0,
    '90_DAYS': 0,
    '120_DAYS': 0,
    'ABOVE_120_DAYS': 0,
    'CURRENT': 0
  };
  this.openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
  this.totalDebit = 0;
  this.totalCredit = 0;
  this.openingBalance = 0;
  this.closingBalance = 0;
    this.spwtrnlistData = []
  }

  getSPWTRNLIST(customer: any) {
    this.spwtrnlistData = []
        this.periodTotalDebit = 0;
  this.periodTotalCredit = 0;
  this.periodClosingBalance = 0;
  this.periodAgeingSummary = {
    '30_DAYS': 0,
    '60_DAYS': 0,
    '90_DAYS': 0,
    '120_DAYS': 0,
    'ABOVE_120_DAYS': 0,
    'CURRENT': 0
  };
  this.openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
  this.totalDebit = 0;
  this.totalCredit = 0;
  this.openingBalance = 0;
  this.closingBalance = 0;
    this.selectedSupplier = customer
  }

setSPWTRNLIST() {
  if (!this.startDate || !this.endDate) {
    alert('Please select both start and end dates.');
    return;
  }
      this.periodTotalDebit = 0;
  this.periodTotalCredit = 0;
  this.periodClosingBalance = 0;
  this.periodAgeingSummary = {
    '30_DAYS': 0,
    '60_DAYS': 0,
    '90_DAYS': 0,
    '120_DAYS': 0,
    'ABOVE_120_DAYS': 0,
    'CURRENT': 0
  };
  this.openingBalanceData = {
    DEBIT: 0,
    CREDIT: 0,
    BALANCE: 0,
  };
  this.totalDebit = 0;
  this.totalCredit = 0;
  this.openingBalance = 0;
  this.closingBalance = 0;

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
      '120_DAYS': 0,
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

  exportSPWTRNLIST(): void {
    const fileName = `${this.selectedSupplier.PCODE}-transaction-listing-${this.mCurDate}-period-${this.startDate}-${this.endDate}.xlsx`;

    // 1. Create worksheet from spwsoaData
    const spwsoaSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.spwsoaData.map(row => ({
      'Invoice Date': row.INV_DATE ? new Date(row.INV_DATE).toLocaleDateString() : '',
      'Invoice No': row.INV_NO,
      'Reference': row.INV_NO === row.REMARKS ? '' : row.REMARKS,
      'Description': row.DESCRIPTION,
      'Due Date': row.DUEDATE ? new Date(row.DUEDATE).toLocaleDateString() : '',
      'Debit': row.REFAMOUNT  || '',
      'Credit': row.INV_AMOUNT  || '',
      'Balance': row.BALANCE
    })));

    // 2. Create another sheet for Ageing Summary
   /*const ageingData = [{
      'Current': this.periodAgeingSummary['CURRENT'] || 0,
      '0 - 30 days': this.periodAgeingSummary['30_DAYS'] || 0,
      '31 - 60 days': this.periodAgeingSummary['60_DAYS'] || 0,
      '61 - 90 days': this.periodAgeingSummary['90_DAYS'] || 0,
      '91 - 120 days': this.periodAgeingSummary['120_DAYS'] || 0,
      'Above 120 days': this.periodAgeingSummary['ABOVE_120_DAYS'] || 0,
      'Total Outstanding': (
        (this.periodAgeingSummary['CURRENT'] || 0) +
        (this.periodAgeingSummary['30_DAYS'] || 0) +
        (this.periodAgeingSummary['60_DAYS'] || 0) +
        (this.periodAgeingSummary['90_DAYS'] || 0) +
        (this.periodAgeingSummary['120_DAYS'] || 0) +
        (this.periodAgeingSummary['ABOVE_120_DAYS'] || 0)
      )
    }];

    const ageingSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(ageingData);*/

    // 3. Create a workbook and add the sheets
    const workbook: XLSX.WorkBook = {
      Sheets: {
        'Statement': spwsoaSheet,
        //'Ageing Summary': ageingSheet
      },
      SheetNames: ['Statement']//, 'Ageing Summary']
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

    openSWTRNSUM() {
    this.dialog.open(this.swtrnsumLookupDialog, {
      width: '100vw',
      maxWidth: '100vw'
    });
    this.loadSuppliers();
  }


async applySupplierTranFilters() {

  this.getData = true;
  this.swtrnsumData = [];
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
      
      const outstanding = await this.computeTranOutstanding(supplier.PCODE, this.endDate ? new Date(this.endDate) : new Date(), 'S');
      
      return {
        ...supplier,
        CURRENT_OUTSTANDING: outstanding
      };
    })
  );

  // 🔹 Now assign everything at once
  this.swtrnsumData = results;

  this.totalOutstanding = results.reduce((sum, s) => {
    return sum + (Number(s.CURRENT_OUTSTANDING) || 0);
  }, 0);

  this.getData = false;
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

    exportSWTRNSUM() {
    const fileName = `Supplier-transaction-summary-ason-${this.formatDate(this.endDate)}-${this.formatDate(new Date())}.xlsx`;
    const sheetData = this.swtrnsumData.map(s => ({
      'Supplier Code': s.PCODE,
      'Supplier Name': s.CUST_NAME,
      'Nature': s.Nature,
      'Category': s.SupplierCategory,
      'Payment Term': s.REMARKS || '',
      'Current Outstanding': s.CURRENT_OUTSTANDING?.toFixed(3) || '0.000'
    }));
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook: XLSX.WorkBook = { Sheets: { 'SupplierOutstanding': worksheet }, SheetNames: ['SupplierOutstanding'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    FileSaver.saveAs(blob, fileName);
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



  formatDate(date: any) {
    var d = new Date(date), day = '' + d.getDate(), month = '' + (d.getMonth() + 1), year = d.getFullYear();

    if (day.length < 2) {
      day = '0' + day;
    } 
    if (month.length < 2) {
      month = '0' + month;
    }
    return [day, month, year].join('-');
  }

  getDate(date: any) {
    var d = new Date(date), day = '' + d.getDate(), month = '' + (d.getMonth() + 1), year = d.getFullYear();

    if (day.length < 2) {
      day = '0' + day;
    } 
    if (month.length < 2) {
      month = '0' + month;
    }
    return [year, month, day].join('-');
  }

    // Helper method to remove any surrounding quotes
  private removeQuotes(value: string | null): string {
    if (value) {
      return value.replace(/^"|"$/g, ''); // Removes quotes at the start and end of the string
    }
    return '';
  }
}


