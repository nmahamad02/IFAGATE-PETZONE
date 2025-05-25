import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountsService } from 'src/app/services/accounts/accounts.service';
import { DataSharingService } from 'src/app/services/data-sharing/data-sharing.service';
import { FinanceService } from 'src/app/services/finance/finance.service';

@Component({
  selector: 'app-receipt-voucher-allocation',
  templateUrl: './receipt-voucher-allocation.component.html',
  styleUrls: ['./receipt-voucher-allocation.component.scss']
})
export class ReceiptVoucherAllocationComponent {
  public rvForm: FormGroup;
  openInvList: any[] =[]
  allocatedInvList: any[] =[]

  mAllocatedAmount = 0
  mRvcBalance: number = 0

  @ViewChild('rvLookupDialog', { static: false }) rvLookupDialog!: TemplateRef<any>;

  rvcData: any

  constructor(private route: ActivatedRoute, private dialog: MatDialog, private router: Router, private accountService: AccountsService, private dataSharingService: DataSharingService, private financeService: FinanceService) { 
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      let rvcid = params['id'];
      let pcode = params['pcode'];
      this.getAllocationData(rvcid,pcode); // Reload data
    });
  }

  getAllocationData(rvcid: string,pcode: string){
    this.financeService.getTranHead(rvcid).subscribe((res: any) =>{
      console.log(res)
      this.financeService.getSGLDataTemp(rvcid).subscribe((resp: any) =>{
        console.log(resp)
        this.rvcData = resp.recordset.find((acc:any) => acc.ACCODE === pcode);
        this.rvForm = new FormGroup({
          rvcNo: new FormControl(this.rvcData.VCR_NO, [ Validators.required]),
          rvcDate: new FormControl(this.formatInputDate(this.rvcData.VCR_DATE), [ Validators.required]),
          rvcAmount: new FormControl(0.000, [ Validators.required]),
          rvcNarration: new FormControl(this.rvcData.REMARKS, [ Validators.required]),
          rvcBalance: new FormControl('0.000', [ Validators.required]),
          debitAccount: new FormControl(this.rvcData.ACCODE, [ Validators.required]),
          invNo: new FormControl('', [ Validators.required]),
          invDate: new FormControl('', [ Validators.required]),
          invAmount: new FormControl('', [ Validators.required]),
          invNarration: new FormControl('', [ Validators.required]),
          invBalance: new FormControl('0.000', [ Validators.required]),
        });
        this.getInvoiceDetails(pcode)
      },(erro: any) => {
        console.log(erro)
      })
    }, (err: any) => {
      console.log(err)
    })
  }

  setInvoice(inv: any) {
    let dialogRef = this.dialog.open(this.rvLookupDialog, {
      width: '80vw',  // 80% of viewport width
      maxHeight: '80vh',  // 80% of viewport height
    });
    this.rvForm.patchValue({
      invNo: inv.INV_NO,
      invDate: this.formatInputDate(inv.INV_DATE),
      invAmount: inv.AMOUNT.toFixed(3),
      invNarration: inv.DESCRIPTION,
      invBalance: inv.AMOUNT.toFixed(3),
    });
  }

  calcBalance() {
    const data = this.rvForm.value
    console.log(data)
    if(Number(data.rvcAmount) > Number(data.rvcBalance)) {
      alert("Insufficient funds to allocate!")
    } else if (Number(data.rvcAmount) > Number(data.invAmount)) {
      alert("Cannot allocate funds more than invoice amount!")
    } else {
      this.rvForm.patchValue({
        invBalance: (data.invAmount - data.rvcAmount).toFixed(3)
      })
    }
  }

  getInvoiceDetails(custcode: string){
    this.financeService.getUnallocatedInvoice(custcode).subscribe((res: any) => {
      console.log(res.recordset)
      this.openInvList = res.recordset;
    }, (err: any) => {
      console.log(err)
    });
    this.financeService.getPartiallyAllocatedInvoice(custcode, this.rvcData.VCR_NO).subscribe((res: any) => {
      this.allocatedInvList = res.recordset;
      console.log(res.recordset)
    }, (err: any) => {
      console.log(err);
    });
    this.financeService.getReceiptBalance(this.rvcData.VCR_NO).subscribe((res: any) => {
      console.log(res.recordset)
      this.mRvcBalance = this.rvcData.AMOUNT - res.recordset[0].ALLAMOUNT
      this.rvForm.patchValue({
        rvcBalance: this.mRvcBalance.toFixed(3)
      })
    }, (erro: any) => {
      console.log(erro);
      this.mRvcBalance = this.rvcData.AMOUNT
      this.rvForm.patchValue({
        rvcBalance: this.mRvcBalance.toFixed(3)
      })
    });
  }
  
  formatInputDate(date: any) {
    var d = new Date(date), day = '' + d.getDate(), month = '' + (d.getMonth() + 1), year = d.getFullYear();

    if (day.length < 2) {
      day = '0' + day;
    } 
    if (month.length < 2) {
      month = '0' + month;
    }
    return [year, month, day].join('-');
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

  public gotoReceiptVoucherDetails(url: any, id: any) {
    var myurl = `${url}/${id}`;
    this.router.navigateByUrl(myurl).then(e => {
    });
  }
}
