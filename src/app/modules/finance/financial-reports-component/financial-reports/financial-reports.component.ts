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
import { firstValueFrom, forkJoin } from 'rxjs';
import { NgZone } from '@angular/core';

@Component({
  selector: 'app-financial-reports',
  templateUrl: './financial-reports.component.html',
  styleUrls: ['./financial-reports.component.scss']
})
export class FinancialReportsComponent {

  userRight = localStorage.getItem('userright')!

  @ViewChild('lwpsLookupDialog', { static: false }) lwpsLookupDialog!: TemplateRef<any>;
  @ViewChild('gltrnlistLookupDialog', { static: false }) gltrnlistLookupDialog!: TemplateRef<any>;
  @ViewChild('costVerificationDialog', { static: false }) costVerificationDialog!: TemplateRef<any>;
  @ViewChild('lwpcLookupDialog', { static: false }) lwpcLookupDialog!: TemplateRef<any>;

  currentYear = new Date().getFullYear()
  mCurDate = this.formatDate(new Date())

  yearList: number[] = [];
  selectedYear: number = new Date().getFullYear();

  mossumData: any[] = []
  lwpsData: any[] = [];
  lwpsGroupedData: any[] = [];
  gltrnlistData:any[] = [];

  groupedData: any[] = [];
  grandTotal: number = 0;

  locationList: any[] = [];
  customerList: any[] = [];
  glList: any[] = [];
  selectedGLs: string[] = [];

  glGroupedData: any[] = [];

grandDebit = 0;
grandCredit = 0;
grandBalance = 0;

  productDetails: any[] = [];
  costDetails: any[] = [];
  transactionData : any[] = [];
  groupedTransactions: any[] = [];

  selectedLocation: string = 'NULL'
  selectedCustomer: string = 'NULL'
  selectedProduct: any;

  searchText = '';
  selectedGL: string = 'NULL'

  startDate = '2026-01-01'
  endDate = '2026-12-31'

  totalDebit = 0;
totalCredit = 0;
finalBalance = 0;

  getData: boolean = false;

    loadingProgress: { current: number; total: number; rowsLoaded: number } | null = null;

    lwpcData: any[] = [];
    lwpcGroupedData: any[] = [];
    selectedLWPCYear: number = new Date().getFullYear();
    selectedLWPCMonth: number = new Date().getMonth() + 1;

    monthList = [
  { value: 1, name: 'January' }, { value: 2, name: 'February' }, { value: 3, name: 'March' },
  { value: 4, name: 'April' }, { value: 5, name: 'May' }, { value: 6, name: 'June' },
  { value: 7, name: 'July' }, { value: 8, name: 'August' }, { value: 9, name: 'September' },
  { value: 10, name: 'October' }, { value: 11, name: 'November' }, { value: 12, name: 'December' }
];


  /* ------------------------------ SALES UNITS ------------------------------- */

  salesUnits: { id: string; name: string; code: string; country: string }[] = [];
  selectedUnit!: { id: string; name: string; code: string; country: string };
  selectedCountryCode = 'un';

  constructor(private ngZone: NgZone, private financeService: FinanceService, private route: ActivatedRoute, private dialog: MatDialog, private router: Router, private accountService: AccountsService, private reportService: ReportsService, private dataSharingService: DataSharingService, private sapservice: SapService) { 
    console.log(this.userRight)
    this.reportService.getLocation().subscribe((res: any) => {
      this.locationList = res.recordset
      console.log(this.locationList)
    })
    this.reportService.getProductListPostGres().subscribe((res: any) => {
      this.productDetails = res
      console.log(this.productDetails)
    })
    this.financeService.getAllGLCode().subscribe((res: any) => {
      this.glList = res.recordset
      console.log(this.glList)
    })
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
  }

  ngOnInit() {
  const currentYear = new Date().getFullYear();
  this.yearList = Array.from({ length: 7 }, (_, i) => currentYear - i);
  this.selectedYear = currentYear;
    this.loadSalesUnits();
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

      console.log(res)
      if (!res || res.length === 0) {
        alert('No data for selected criteria');
        this.getData = false;
        return;
      }

      this.lwpsData = res;
      this.getData = false;

      const map: any = {};

      this.lwpsData.forEach(r => {
        if (!map[r.Location]) map[r.Location] = [];
        map[r.Location].push(r);
      });

      this.lwpsGroupedData = Object.keys(map).map(loc => {
        const rows = map[loc];

        const totalqty = rows.reduce((sum: number, x: any) => sum + Number(x.Quantity || 0), 0);
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

private async fetchChunk(start: string, end: string, location: string, attempt = 1): Promise<any[]> {
  const rows: any[] = [];
  try {
    const response = await fetch(`https://ifagate-petzone-api.theworkpc.com/api/report/get-locationwise-profit-stream/${start}/${end}/${location}`);
    if (!response.ok || !response.body) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.trim()) rows.push(JSON.parse(line));
      }
    }
    if (buffer.trim()) rows.push(JSON.parse(buffer));
    return rows;

  } catch (err) {
    if (attempt < 3) {
      console.warn(`Chunk ${start}–${end} failed (attempt ${attempt}), retrying...`, err);
      await new Promise(r => setTimeout(r, 1000 * attempt)); // backoff: 1s, 2s
      return this.fetchChunk(start, end, location, attempt + 1);
    }
    throw new Error(`Chunk ${start}–${end} failed after 3 attempts: ${err}`);
  }
}


private buildDateChunks(startDate: string, endDate: string, chunkDays = 3): Array<[string, string]> {
  const chunks: Array<[string, string]> = [];
  let cursor = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');

  while (cursor <= end) {
    const chunkStart = new Date(cursor);
    const chunkEnd = new Date(cursor);
    chunkEnd.setUTCDate(chunkEnd.getUTCDate() + chunkDays - 1);
    if (chunkEnd > end) chunkEnd.setTime(end.getTime());

    chunks.push([this.toIsoDate(chunkStart), this.toIsoDate(chunkEnd)]);
    cursor.setUTCDate(cursor.getUTCDate() + chunkDays);
  }
  return chunks;
}
private toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

  async newGetLWPS() {
    if (!this.startDate || !this.endDate) {
      alert('Please select start & end date');
      return;
    }

    this.getData = true;
    this.lwpsGroupedData = [];
    this.loadingProgress = { current: 0, total: 0, rowsLoaded: 0 };

    const start = this.formatDate(this.startDate);
    const end = this.formatDate(this.endDate);
    const location = this.selectedLocation;

    const chunks = this.buildDateChunks(start, end, 3);
    const allRows: any[] = [];

    this.ngZone.run(() => {
      this.loadingProgress = { current: 0, total: chunks.length, rowsLoaded: 0 };
    });

    try {
      for (let i = 0; i < chunks.length; i++) {
        const [chunkStart, chunkEnd] = chunks[i];
        const rows = await this.fetchChunk(chunkStart, chunkEnd, location);
        allRows.push(...rows);

        // update progress after every chunk — this is what the template will show live
        this.ngZone.run(() => {
          this.loadingProgress = {
            current: i + 1,
            total: chunks.length,
            rowsLoaded: allRows.length
          };
        });
      }

      this.ngZone.run(() => {
        this.getData = false;
        this.loadingProgress = null;

        if (allRows.length === 0) {
          alert('No data for selected criteria');
          return;
        }

        this.lwpsData = allRows;

        const map: any = {};
        this.lwpsData.forEach(r => {
          if (!map[r.Location]) map[r.Location] = [];
          map[r.Location].push(r);
        });

        this.lwpsGroupedData = Object.keys(map).map(loc => {
          const rows = map[loc];
          const totalqty = rows.reduce((sum: number, x: any) => sum + Number(x.Quantity || 0), 0);
          const totalSales = rows.reduce((sum: number, x: any) => sum + Number(x.GrossAmount || 0), 0);
          const totalCost = rows.reduce((sum: number, x: any) => sum + Number(x.CostOfSale || 0), 0);
          const totalProfit = totalSales - totalCost;
          return {
            location: loc, rows, totalqty, totalSales, totalCost, totalProfit,
            margin: totalCost === 0 ? 0 : (totalProfit / totalCost) * 100
          };
        });
      });

    } catch (err) {
      this.ngZone.run(() => {
        console.error('LWPS fetch error:', err);
        alert('Failed to load full report — one date range failed repeatedly. Please try again.');
        this.getData = false;
        this.loadingProgress = null;
      });
    }
  }


exportLWPS() {
  const location = this.selectedLocation;
  const start = this.formatDate(this.startDate);
  const end = this.formatDate(this.endDate);
  const url = `https://ifagate-petzone-api.theworkpc.com/api/report/export-locationwise-profit-xlsx/${start}/${end}/${location}`;
  window.open(url, '_blank');
}
private safeNum(val: any): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

  openGLTRLT() {
  this.dialog.open(this.gltrnlistLookupDialog, {
    width: '95%',
    maxWidth: '95vw'
  });    
  this.gltrnlistData = []
    this.glGroupedData = [];   // was: this.gltrnlistData = []
  this.grandDebit = 0;
  this.grandCredit = 0;
  this.grandBalance = 0;
  }

async getGLTRNList() {
  this.getData = true;
  this.glGroupedData = [];
  this.grandDebit = 0;
  this.grandCredit = 0;
  this.grandBalance = 0;

  const start = this.formatDate(this.startDate);
  const end = this.formatDate(this.endDate);
  const glcodes = this.selectedGLs.join(',');

  try {
    const response = await fetch(
      `https://ifagate-petzone-api.theworkpc.com/api/report/get-gl-tran-listing-stream/${start}/${end}/${glcodes}/${this.selectedUnit.id}`
    );
    if (!response.ok || !response.body) throw new Error(`Request failed: ${response.status}`);

    const openingMap = JSON.parse(response.headers.get('X-Opening-Balances') || '{}');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const rowsByGL: { [glcode: string]: any[] } = {};

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        const row = JSON.parse(line);
        if (!rowsByGL[row.glcode]) rowsByGL[row.glcode] = [];
        rowsByGL[row.glcode].push(row);
      }
    }
    if (buffer.trim()) {
      const row = JSON.parse(buffer);
      if (!rowsByGL[row.glcode]) rowsByGL[row.glcode] = [];
      rowsByGL[row.glcode].push(row);
    }

    this.ngZone.run(() => {
      for (const gl of this.selectedGLs) {
        const periodRows = rowsByGL[gl] || [];
        const openingBalance = Number(openingMap[gl] || 0);

        let running = openingBalance;
        let totalDebit = 0, totalCredit = 0;

        const rows = periodRows.map((row: any) => {
          const debit = Number(row.debit || 0);
          const credit = Number(row.credit || 0);
          running += (debit + credit);
          totalDebit += debit;
          totalCredit += credit;
          return { ...row, running_balance: running };
        });

        const openingRow = {
          docdate: null, docid: '', journalentry: 'OPENING BALANCE', journalref: '',
          companycurrency: rows[0]?.companycurrency || '', debit: 0, credit: 0,
          running_balance: openingBalance
        };

        const glObj = this.glList.find((x: any) => x.GLCODE === gl);

        this.glGroupedData.push({
          glcode: gl, glname: glObj?.GLNAME,
          rows: [openingRow, ...rows],
          totalDebit, totalCredit, balance: running
        });

        this.grandDebit += totalDebit;
        this.grandCredit += totalCredit;
        this.grandBalance += running;
      }
      this.getData = false;
    });

  } catch (err) {
    console.error('GL tran listing fetch error:', err);
    this.ngZone.run(() => { this.getData = false; });
    alert('Failed to load GL transaction listing.');
  }
}

exportGLTRNList() {
  const start = this.formatDate(this.startDate);
  const end = this.formatDate(this.endDate);
  const glcodes = this.selectedGLs.join(',');
  const url = `https://ifagate-petzone-api.theworkpc.com/api/report/export-gl-tran-listing-xlsx/${start}/${end}/${glcodes}/${this.selectedUnit.id}`;
  window.open(url, '_blank');
}

private async fetchGLChunk(start: string, end: string, glcodes: string, compcode: string, attempt = 1): Promise<{ rows: any[], openingHeader: string | null }> {
  const rows: any[] = [];
  try {
    const response = await fetch(`https://ifagate-petzone-api.theworkpc.com/api/report/get-gl-tran-listing-stream/${start}/${end}/${glcodes}/${compcode}`);
    if (!response.ok || !response.body) throw new Error(`Request failed: ${response.status}`);

    const openingHeader = response.headers.get('X-Opening-Balances');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.trim()) rows.push(JSON.parse(line));
      }
    }
    if (buffer.trim()) rows.push(JSON.parse(buffer));
    return { rows, openingHeader };

  } catch (err) {
    if (attempt < 3) {
      console.warn(`GL chunk ${start}–${end} failed (attempt ${attempt}), retrying...`, err);
      await new Promise(r => setTimeout(r, 1000 * attempt));
      return this.fetchGLChunk(start, end, glcodes, compcode, attempt + 1);
    }
    throw new Error(`GL chunk ${start}–${end} failed after 3 attempts: ${err}`);
  }
}

async newGetGLTRNList() {
  if (!this.startDate || !this.endDate || this.selectedGLs.length === 0) {
    alert('Please select GL account(s), start & end date');
    return;
  }

  this.getData = true;
  this.glGroupedData = [];
  this.grandDebit = 0;
  this.grandCredit = 0;
  this.grandBalance = 0;

  const start = this.formatDate(this.startDate);
  const end = this.formatDate(this.endDate);
  const glcodesParam = this.selectedGLs.join(',');
  const compcode = this.selectedUnit.id;

  const chunks = this.buildDateChunks(start, end, 3);

  // Accumulators only — no row storage. This is the whole point:
  // summary-only display means we never need more than these three numbers per GL.
  const glMap: { [glcode: string]: { openingBalance: number; totalDebit: number; totalCredit: number } } = {};
  this.selectedGLs.forEach(gl => { glMap[gl] = { openingBalance: 0, totalDebit: 0, totalCredit: 0 }; });

  this.ngZone.run(() => {
    this.loadingProgress = { current: 0, total: chunks.length, rowsLoaded: 0 };
  });

  let rowsLoaded = 0;

  try {
    for (let i = 0; i < chunks.length; i++) {
      const [chunkStart, chunkEnd] = chunks[i];
      const { rows, openingHeader } = await this.fetchGLChunk(chunkStart, chunkEnd, glcodesParam, compcode);

      // Only chunk 0's opening balance is computed against the TRUE overall
      // start date. Every later chunk's header would be relative to its own
      // chunk start and double-count what earlier chunks already summed —
      // so it gets discarded on purpose.
      if (i === 0 && openingHeader) {
        try {
          const parsed = JSON.parse(openingHeader);
          Object.keys(parsed).forEach(gl => {
            if (glMap[gl]) glMap[gl].openingBalance = Number(parsed[gl] || 0);
          });
        } catch (e) {
          console.warn('Failed to parse opening balances header', e);
        }
      }

      rows.forEach((row: any) => {
        const gl = row.glcode;
        if (!glMap[gl]) glMap[gl] = { openingBalance: 0, totalDebit: 0, totalCredit: 0 };
        glMap[gl].totalDebit += this.safeNum(row.debit);
        glMap[gl].totalCredit += this.safeNum(row.credit); // pre-signed at source — do not re-sign
      });

      rowsLoaded += rows.length;

      this.ngZone.run(() => {
        this.loadingProgress = { current: i + 1, total: chunks.length, rowsLoaded };
      });
    }

    this.ngZone.run(() => {
      this.getData = false;
      this.loadingProgress = null;

      this.glGroupedData = this.selectedGLs.map(gl => {
        const glObj = this.glList.find((x: any) => x.GLCODE === gl);
        const data = glMap[gl];
        const balance = data.openingBalance + data.totalDebit + data.totalCredit;

        return {
          glcode: gl,
          glname: glObj?.GLNAME,
          openingBalance: data.openingBalance,
          totalDebit: data.totalDebit,
          totalCredit: Math.abs(data.totalCredit), // display positive, matches existing `| abs` pipe usage elsewhere
          balance
        };
      });

      this.grandDebit = this.glGroupedData.reduce((s, g) => s + g.totalDebit, 0);
      this.grandCredit = this.glGroupedData.reduce((s, g) => s + g.totalCredit, 0);
      this.grandBalance = this.glGroupedData.reduce((s, g) => s + g.balance, 0);
    });

  } catch (err) {
    this.ngZone.run(() => {
      console.error('GL transaction listing fetch error:', err);
      alert('Failed to load report — one date range failed repeatedly. Please try again.');
      this.getData = false;
      this.loadingProgress = null;
    });
  }
}

formatExcelDate(date: any): string {
  if (!date) return '';

  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}-${month}-${year}`; // or yyyy-mm-dd if you prefer
}

openCostVerification() {
  this.dialog.open(this.costVerificationDialog, {
    width: '95%',
    maxWidth: '95vw'
  });

  this.selectedProduct = {};
  this.startDate = '2026-01-01';
  this.endDate = '2026-12-31';
  this.costDetails = [];
  this.transactionData = [];
  this.getData = false;
}

  setProductDetails(product: any) {
    this.selectedProduct = product
  }

  getCostList(){
    if (!this.selectedProduct || !this.startDate || !this.endDate) {
    alert('Please select product, start date, and end date');
    return;
  }
  const productId = this.selectedProduct.material_id;

  this.reportService.getCostVerificationCostDetails(productId).subscribe((res: any) => {
    this.costDetails = res
  }, (err) => {
      console.error(err);
      this.getData = false;
      alert('Failed to load cost details');
    })

  }

getCostVerification(locId: string) {

  this.getData = true;

  const productId = this.selectedProduct.material_id;
  const start = this.formatDate(this.startDate);
  const end = this.formatDate(this.endDate);

  this.reportService.getCostVerificationCostTransactions(start, end, productId, locId).subscribe((res: any) => {
    this.transactionData = res
    this.getData = false;
  }, (err) => {
      console.error(err);
      this.getData = false;
      alert('Failed to load transaction');
    })
}

getProductType(productId: any): string {
  const id = Number(productId);
  if (!isFinite(id)) return '';

  return id < 1000 ? 'Service' : 'Product';
}

getThirdParty(GLname: string): string {
  if (!GLname || GLname === 'Not Assigned') {
    return '';
  }

  return GLname;
}

getBrandType(productId: any, brand: string): string {
  const id = Number(productId);
  if (!isFinite(id)) return '';

  return id < 1000 ? 'Service' : brand;
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

openLWPC() {
  this.dialog.open(this.lwpcLookupDialog, {
    width: '80%',
    maxWidth: '90vw'
  });
  this.lwpcData = [];
}

getLWPC() {
  this.getData = true;
  this.reportService.getLocationProductCount(this.selectedLWPCYear, this.selectedLWPCMonth)
    .subscribe((res: any) => {
      this.lwpcData = res || [];
      this.getData = false;

      if (this.lwpcData.length === 0) {
        alert('No data for selected period');
        this.lwpcGroupedData = [];
        return;
      }

      const map: { [key: string]: any[] } = {};
      this.lwpcData.forEach((row: any) => {
        if (!map[row.location_name]) map[row.location_name] = [];
        map[row.location_name].push(row);
      });

      this.lwpcGroupedData = Object.keys(map).map(loc => {
        const rows = map[loc];
        const totalOrdered = rows.reduce((s, r) => s + Number(r.qty_ordered || 0), 0);
        const totalDelivered = rows.reduce((s, r) => s + Number(r.qty_delivered || 0), 0);

        return {
          location: loc,
          rows,
          totalOrdered,
          totalDelivered
        };
      });
    }, () => {
      this.getData = false;
      alert('Failed to load report');
    });
}

exportLWPC(): void {
  const monthName = this.monthList.find(m => m.value === this.selectedLWPCMonth)?.name;
  const fileName = `location-product-count-${monthName}-${this.selectedLWPCYear}.xlsx`;

  const rows: any[] = [];
  rows.push([{ v: 'Location-wise Product Count', s: { font: { bold: true, sz: 16 } } }]);
  rows.push([`Period: ${monthName} ${this.selectedLWPCYear}`]);
  rows.push([]);
  rows.push([
    { v: 'Location', s: { font: { bold: true } } },
    { v: 'Product Code', s: { font: { bold: true } } },
    { v: 'Product Name', s: { font: { bold: true } } },
    { v: 'Supplier Code', s: { font: { bold: true } } },
    { v: 'Supplier Name', s: { font: { bold: true } } },
    { v: 'Order Qty', s: { font: { bold: true } } },
    { v: 'Delivered', s: { font: { bold: true } } }
  ]);

  this.lwpcGroupedData.forEach(group => {
    group.rows.forEach((row: any) => {
      rows.push([
        row.location_name,
        row.product_id,
        row.product_name,
        row.supplier_id,
        row.supplier_name,
        Number(row.qty_ordered),
        Number(row.qty_delivered)
      ]);
    });

    rows.push([
      '', '', '', '',
      `${group.location} Subtotal`,
      Number(group.totalOrdered),
      Number(group.totalDelivered)
    ]);
    rows.push([]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook: XLSX.WorkBook = { Sheets: { Report: worksheet }, SheetNames: ['Report'] };
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  FileSaver.saveAs(blob, fileName);
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

  private removeQuotes(val: string | null): string {
    return val ? val.replace(/^"|"$/g, '') : '';
  }

}