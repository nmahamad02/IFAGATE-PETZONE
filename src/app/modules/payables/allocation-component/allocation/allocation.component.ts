
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AccountsService } from 'src/app/services/accounts/accounts.service';
import { FinanceService } from 'src/app/services/finance/finance.service';

@Component({
  selector: 'app-allocation',
  templateUrl: './allocation.component.html',
  styleUrls: ['./allocation.component.scss']
})
export class AllocationComponent {

  @ViewChild('viewAllocationLookupDialog', { static: false }) viewAllocationLookupDialog!: TemplateRef<any>;
  
  supplierList: any[] = [];
  intermediariesList: any[] = [];
  
  payments: any[] = [];
  invoices: any[] = [];

  selectedReceipts: any[] = [];
  selectedInvoices: any[] = [];

  allocatedReceipts: any[] = [];
  allocatedInvoices: any[] = [];

  allocationLines: any[] = [];

  searchText = '';
  selectedSupplier: any;
  isSearching = false;

  currentYear = new Date().getFullYear();

  modes = [
    { value: 'SUPPLIER', label: 'Supplier' },
    { value: 'INTERMEDIARY', label: 'Intermediary' }
  ];
  mode = this.modes[0];

  constructor(private accountService: AccountsService,private financeService: FinanceService, private dialog: MatDialog) {

    this.accountService.listOpbal(this.currentYear.toString(), 'S').subscribe((res: any) => {
      this.supplierList = res.recordset || []
    });

    this.accountService.listOpbal(this.currentYear.toString(), 'G').subscribe((res: any) => {
      this.intermediariesList = res.recordset || []
    });
  }

  get activeList() {
    return this.mode.value === 'SUPPLIER'
      ? this.supplierList
      : this.intermediariesList;
  }

  onModeChange() {
    this.searchText = '';
    this.selectedSupplier = null;
    this.reset();
  }
  
  selectEntity(e: any) {
    this.selectedSupplier = e;
    this.searchText = e.CUST_NAME;
    this.isSearching = false;
    this.getAllocationData(e.PCODE);
  }

  getAllocationData(pcode: string) {
    this.financeService.getAllReceiptPayments(pcode).subscribe((res: any) => {
      this.payments = (res.recordset || []).map((p: any) => ({
        ...p,
        selected: false
      }));
    }, (err: any) => {
      this.payments = []
    });

    this.financeService.getSelectedCustomerBills(pcode).subscribe((res: any) => {
      this.invoices = (res.recordset || []).map((i: any) => ({
        ...i,
        selected: false
      }));
    }, (err: any) => {
      this.invoices = []
    });
  }

  toggleReceipt(r: any) {
    if (r.selected) {
      this.selectedReceipts.push({ ...r, REMAINING: r.BALANCE });
    } else {
      this.selectedReceipts =
      //this.selectedReceipts.filter(x => x.REFNO !== r.REFNO);
      this.selectedReceipts.filter(x => x.REF_OPFLAG !== r.REF_OPFLAG);
    }
  }

  toggleInvoice(i: any) {
    if (i.selected) {
      this.selectedInvoices.push({ ...i, REMAINING: i.BALANCE });
    } else {
      this.selectedInvoices =
      //this.selectedInvoices.filter(x => x.INV_NO !== i.INV_NO);
      this.selectedInvoices.filter(x => x.INV_OPFLAG !== i.INV_OPFLAG);
    }
  }

  addAllocations() {
    this.allocationLines = [];

    const invoices = this.selectedInvoices.map(i => ({ ...i }));
    const receipts = this.selectedReceipts.map(r => ({ ...r }));

    for (const rcpt of receipts) {
      let rBal = rcpt.REMAINING;

      for (const inv of invoices) {
        if (rBal <= 0 || inv.REMAINING <= 0) continue;

        //const amt = Math.min(inv.REMAINING, rBal);
        const amt = this.r4(Math.min(inv.REMAINING, rBal));

        this.allocationLines.push({
          INV_OPFLAG: inv.INV_OPFLAG,
          REF_OPFLAG: rcpt.REF_OPFLAG,
          INV_NO: inv.INV_NO,
          REFNO: rcpt.REFNO,
          ALLOC_AMOUNT: amt,          // default
          MAX_ALLOC: amt,             // 🔒 safety cap
          INV_REMAINING_BEFORE: inv.REMAINING,
          RCPT_REMAINING_BEFORE: rBal,
          INV_REMAINING_AFTER: inv.REMAINING - amt,
          RCPT_REMAINING_AFTER: rBal - amt
        });

        inv.REMAINING -= amt;
        rBal -= amt;
      }
    }
  }

recalculateAllocation(index: number) {
  const row = this.allocationLines[index];

  let value = Number(row.ALLOC_AMOUNT);
  if (isNaN(value) || value < 0) value = 0;

  value = this.r4(Math.min(value, row.MAX_ALLOC));
  row.ALLOC_AMOUNT = value;

  row.INV_REMAINING_AFTER = this.r4(row.INV_REMAINING_BEFORE - value);
  row.RCPT_REMAINING_AFTER = this.r4(row.RCPT_REMAINING_BEFORE - value);
}

  saveAllocation() {
  if (!this.allocationLines.length || !this.selectedSupplier) {
    return;
  }

  const cardNo = this.selectedSupplier.PCODE;

  let completed = 0;
  const total = this.allocationLines.length;

  for (const line of this.allocationLines) {

    this.financeService
      .saveInvoiceReceiptAllocation(line.INV_NO, line.REFNO,cardNo, line.ALLOC_AMOUNT,line.INV_OPFLAG, line.REF_OPFLAG)
      .subscribe({
        next: () => {
          completed++;

          // When all rows saved successfully
          if (completed === total) {
            alert('Allocation saved successfully.');
            this.reloadPage();
          }
        },
        error: (err) => {
          console.error('Allocation save failed', err);
          alert('Error saving allocation. Please check logs.');
        }
      });
  }
}

viewAllocations(){
  this.allocatedInvoices = []
  this.allocatedReceipts = []
  this.dialog.open(this.viewAllocationLookupDialog, {
    width: '100vw',
    maxWidth: '100vw',
  })

  this.financeService.getAllocatedReceipts(this.selectedSupplier.PCODE).subscribe((res: any) => {
    console.log(res)
    this.allocatedReceipts = res.recordset || []
  })
}

getAllocatedInvoices(refno: string){
this.financeService.getAllocatedInvoices(refno,this.selectedSupplier.PCODE).subscribe((res: any) => {
      console.log(res)
    this.allocatedInvoices = res.recordset || []
  })
}

deAllocate(id: number) {
  console.log(id)
  if (!confirm('Are you sure you want to de-allocate this entry?')) {
    return;
  }

  this.financeService
    .deleteInvoiceReceiptAllocation(id)
    .subscribe({
      next: () => {
        alert('Allocation removed successfully');
        this.reloadPage(); // refresh main screen
      },
      error: err => {
        console.error(err);
        alert('Failed to de-allocate');
      }
    });
}


reloadPage() {
  this.reset();
  this.getAllocationData(this.selectedSupplier.PCODE);
  this.dialog.closeAll()
}

totalAllocated(): number {
  return this.allocationLines.reduce(
    (s, a) => this.r4(s + a.ALLOC_AMOUNT),
    0
  );
}


  reset() {
    this.selectedInvoices = []
    this.selectedReceipts = []
    this.allocationLines = []
    // ✅ deselect receipts
    this.payments.forEach(p => (p.selected = false));

    // ✅ deselect invoices
    this.invoices.forEach(i => (i.selected = false));
  }
  
  formatAmount(v: number) {
    return (v || 0).toFixed(3);
  }

  private r4(v: number): number {
  return Number((v ?? 0).toFixed(4));
}
}
