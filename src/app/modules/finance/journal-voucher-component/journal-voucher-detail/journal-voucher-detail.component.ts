import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AccountsService } from 'src/app/services/accounts/accounts.service';
import { DataSharingService } from 'src/app/services/data-sharing/data-sharing.service';
import { FinanceService } from 'src/app/services/finance/finance.service';

@Component({
  selector: 'app-journal-voucher-detail',
  templateUrl: './journal-voucher-detail.component.html',
  styleUrls: ['./journal-voucher-detail.component.scss']
})
export class JournalVoucherDetailComponent {
  utc = new Date();
  mCurDate = this.formatInputDate(this.utc);
  mCYear = new Date().getFullYear();

  @ViewChild('jvLookupDialog', { static: false }) jvLookupDialog!: TemplateRef<any>;
  @ViewChild('accountLookupDialog', { static: false }) accountLookupDialog!: TemplateRef<any>;

  jvList: any[] = [];
  accountList: any[] = [];
  currencyList: any[] = [];

  selectedAccountIndex = 0
  selectedRowIndex: number = 0

  public jvForm: FormGroup;

  constructor(private route: ActivatedRoute, private dialog: MatDialog, private router: Router, private accountService: AccountsService, private dataSharingService: DataSharingService, private financeService: FinanceService) { 
    this.jvForm = new FormGroup({
      vcrno: new FormControl('', [ Validators.required]),
      vcrdate: new FormControl('', [ Validators.required]),
      currency: new FormControl('', [ Validators.required]),
      exchangeRate: new FormControl('', [ Validators.required]),
      narration: new FormControl('', [ Validators.required]),
      accounts: new FormArray([]),
    });
  }

  addAccount() {
    const index = this.accounts.length + 1;
    const data = this.jvForm.value
    const account = new FormGroup({
      pcode: new FormControl('', [ Validators.required]),
      custname: new FormControl('', [ Validators.required]),
      desc: new FormControl(data.narration, [ Validators.required]),
      debit: new FormControl('0.000', [ Validators.required]),
      credit: new FormControl('0.000', [ Validators.required]),
      allocate: new FormControl('0.000', [ Validators.required]),
    });
    this.accounts.push(account);
  }

  deleteAccount(index: number) {
    // Show confirmation alert
    if (confirm("Are you sure you want to delete this account?")) {
      if(this.accounts.length === 1){
        console.log(this.accounts.at(index));
      } else {
        this.accounts.removeAt(index);
      }
    }
  }

  newForm(){
    // Find the default currency (BHD) after the currency list is fetched
    const defaultCurrency = this.currencyList.find(cur => cur.SHORTNAME === 'BHD');
    
    if (!defaultCurrency) {
      console.warn("Default currency BHD not found in the list");
      return; // You may handle the case where BHD is not found here
    }
  
    console.log(defaultCurrency);  // This should now log the correct object
  
    this.jvForm = new FormGroup({
      vcrno: new FormControl('***NEW***', [Validators.required]),
      vcrdate: new FormControl(this.mCurDate, [Validators.required]),
      currency: new FormControl(defaultCurrency, [Validators.required]),
      exchangeRate: new FormControl(defaultCurrency.RATE, [Validators.required]),
      narration: new FormControl('', [Validators.required]),
      accounts: new FormArray([]),
    });
  }


  printForm() {
    var doc = new jsPDF("portrait", "px", "a4");
    const data = this.jvForm.value
    console.log(data)
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Journal Voucher', 175, 50);
    doc.line(175, 53, 275, 53);
    doc.setFontSize(12)
    doc.setFont('Helvetica','normal');
    doc.roundedRect(10, 60, 425, 35, 10, 10);
    const wrappedRemarks = doc.splitTextToSize(data.narration, 260);
    doc.text(wrappedRemarks, 15, 72);
    doc.text('Voucher Number',280,72);
    doc.setFont('Helvetica','bold');
    doc.text(`: ${data.vcrno}`,360,72);
    doc.setFont('Helvetica','normal');
    doc.text('Voucher Date',280,85);
    doc.text(`: ${this.formatDate(data.vcrdate)}`,360,85);
    
     // Define table headers
     const headers = [
      ["Account Code", "Account Name", "Description", "Debit Amt (BHD)", "Credit Amount (BHD)"]
    ];

    // Extract data from FormArray
    const tableData = this.accounts.controls.map((control, index) => [
      control.get('pcode')?.value,
      control.get('custname')?.value,
      control.get('desc')?.value,
      { content: control.get('debit')?.value, styles: { halign: 'right' } },  // Right align
      { content: control.get('credit')?.value, styles: { halign: 'right' } }  // Right align
    ]);

    // Calculate totals
    const totalDebit = this.getTotalDebit();
    const totalCredit = this.getTotalCredit();

    // Add footer row for totals (Bold + Right-aligned)
    tableData.push([
      "", "", { content: "Total:", styles: { fontStyle: 'bold' } },
      { content: totalDebit, styles: { fontStyle: 'bold', halign: 'right' } },
      { content: totalCredit, styles: { fontStyle: 'bold', halign: 'right' } }
    ]);

    // Generate table and get the last printed Y position
    const table = autoTable(doc, {
      head: headers,
      body: tableData,
      theme: 'grid',
      startY: 100,
      tableWidth: 425, // Set table width to match (435 - 10)
      margin: { left: 10 }, // Set left margin to 10
      styles: { fontSize: 12 }, // Default font size for body
      headStyles: { 
        fillColor: [0, 0, 0], // Black background
        textColor: [255, 255, 255], // White text
        fontStyle: 'bold'
      },
      bodyStyles: { textColor: [0, 0, 0] },
      columnStyles: { 
        4: { halign: 'right' }, // Right-align Debit column
        5: { halign: 'right' }  // Right-align Credit column
      }
    });

    // Get the Y position after the table
    //const finalY = (doc as any).lastAutoTable?.finalY || 20;

    /*doc.text("Verified", 15, finalY + 100);
    doc.line(15, finalY + 125, 115, finalY + 125);

    doc.text("Authorised", 175, finalY + 100);
    doc.line(175, finalY + 125, 275, finalY + 125);

    doc.text("Approved", 325, finalY + 100);
    doc.line(325, finalY + 125, 425, finalY + 125);*/

    // Add watermark (if necessary)
    doc = this.addWaterMark(doc);
    // Save the PDF
    doc.save(`${data.vcrno}.pdf`);

  }

  addWaterMark(doc: any) {
    var totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setLineWidth(0.25)
      //doc.roundedRect(5, 5, 436, 615, 5, 5);
      var img = new Image()
      img.src = 'assets/pics/favicon.png';
      doc.addImage(img, 'png', 10, 10, 20, 20);
      doc.setFontSize(20)
      doc.setFont('Helvetica','bold');
      doc.setTextColor(0,0,0);
      doc.text('IFASMARTSOFT',35,25);
      doc.setFontSize(13)
      doc.setFont('Helvetica','normal');
      doc.line(5, 35, 441, 35);
      doc.text("Verified", 15, 575);
      doc.line(15, 600, 115, 600);
      doc.text("Authorised", 175, 575);
      doc.line(175, 600, 275, 600);
      doc.text("Approved", 325, 575);
      doc.line(325, 600, 425, 600); 
      doc.setTextColor(0,0,0);
      doc.setFontSize(10)
      const now = new Date();
      const formatted = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      console.log(formatted);
      doc.text(`Page ${i} of ${totalPages}`,390,625);
      doc.text(formatted,15,625);
    }
    return doc;
  }

  getExchangeRate(curCode: any){
    this.jvForm.patchValue({
      exchangeRate: curCode.RATE
    })
  }

  searchJV() {
    let dialogRef = this.dialog.open(this.jvLookupDialog, {
      width: '80vw',  // 80% of viewport width
      maxHeight: '80vh',  // 80% of viewport height
    });
    this.jvList = []
  }

  quickJVSearch(search: string) {
    this.financeService.searchTranHead(this.mCYear.toString(), search, 'JVC').subscribe(
      (res: any) => {
        this.jvList = res.recordset;
      },
      (err: any) => {
        console.error('Search Error:', err);
      }
    );
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
        let pcode = params['id'];
        console.log("Navigated to PCODE:", pcode);
        this.getDetails(pcode); // Reload data
    });
  }

  getDetails(pcode: string) {
    console.log(pcode)
    this.financeService.getCurrencyList().subscribe((res: any) => {
      console.log(res)
      this.currencyList = res.recordset
      if (pcode === 'new') {
        this.newForm();
      } else {
        this.financeService.getTranHead(pcode).subscribe((resp: any) =>{
          console.log(resp)
          const selectedCurrency = this.currencyList.find(cur => cur.SHORTNAME === resp.recordset[0].CURRENCY);
          if (!selectedCurrency) {
            console.warn("Default currency BHD not found in the list");
            return; // You may handle the case where BHD is not found here
          }
          console.log(selectedCurrency);  // This should now log the correct objec
          this.jvForm = new FormGroup({
            vcrno: new FormControl(resp.recordset[0].TRN_NO, [Validators.required]),
            vcrdate: new FormControl(this.formatInputDate(resp.recordset[0].TRN_DATE), [Validators.required]),
            currency: new FormControl(selectedCurrency, [Validators.required]),
            exchangeRate: new FormControl(resp.recordset[0].CURR_RATE, [Validators.required]),
            narration: new FormControl(resp.recordset[0].NARRATION, [Validators.required]),
            accounts: new FormArray([]),
          });
          this.financeService.getSGLDataTemp(pcode).subscribe((respo: any) =>{
            console.log(respo)
            for(let i=0;i<respo.recordset.length;i++){
              this.accountService.getOpbal(this.mCYear.toString(),respo.recordset[i].ACCODE).subscribe((respon: any) =>{
                console.log(respon)
                const account = new FormGroup({
                  pcode: new FormControl(respo.recordset[i].ACCODE, [ Validators.required]),
                  custname: new FormControl(respon.recordset[0].CUST_NAME, [ Validators.required]),
                  desc: new FormControl(respo.recordset[i].REMARKS, [ Validators.required]),
                  debit: new FormControl(Number(respo.recordset[i].GLDB_BAL).toFixed(3), [Validators.required]),
                  credit: new FormControl(Number(respo.recordset[i].GLCR_BAL).toFixed(3), [Validators.required]),
                  allocate: new FormControl('', [ Validators.required]),
                });
                this.accounts.push(account);
              }, (errors: any) => {
                console.log(errors)
              })
            }
          }, (error: any) => {
            console.log(error)
          })
        }, (erro: any) => {
          console.log(erro)
        })
      }
    }, (err: any) => {
      console.log(err)
    })
  }

  getTotalDebit(): string {
    const total = this.accounts.controls.reduce((sum, control) => {
      return sum + (parseFloat(control.get('debit')?.value) || 0);
    }, 0);
    return total.toFixed(3); // Always show 3 decimals
  }
  
  getTotalCredit(): string {
    const total = this.accounts.controls.reduce((sum, control) => {
      return sum + (parseFloat(control.get('credit')?.value) || 0);
    }, 0);
    return total.toFixed(3); // Always show 3 decimals
  }  

  goToDetailForm(vcrno: string) {
    this.dialog.closeAll();  // Close the dialog before navigation
    this.router.navigate(['finance/journal-voucher/detail', vcrno]);
  }
  submitForm() {
    const data = this.jvForm.value;
    console.log(data);
  
    // Validate Debit and Credit Totals
    const totalDebit = this.getTotalDebit();
    const totalCredit = this.getTotalCredit();
  
    if (totalDebit !== totalCredit) {
      alert('Debit and Credit totals do not match');
      return;
    }
  
    if (data.vcrno === '***NEW***') {
      this.financeService.getDoc(this.mCYear.toString(), 'JVNO').subscribe((res: any) => {
        console.log(res);
        const mask = res.recordset[0].MASKVALUE;
        const number = Number(res.recordset[0].FIELD_VALUE_NM) + 1;
        const batchSerial = res.recordset[0].BATCH_SERIAL;
  
        const numericLength = mask.split('-').pop().length;
        const paddedNumber = String(number).padStart(numericLength, '0');
        const newVcrno = mask.replace(/\s+$/, paddedNumber);
  
        console.log(newVcrno);
  
        this.financeService.postTranHead(this.mCYear.toString(), '01', 'JVC','','', 'JVC', newVcrno, this.formatDate(data.vcrdate), data.narration, '0', '0', '0', '0', '0', data.currency.SHORTNAME, data.exchangeRate, batchSerial)
          .subscribe(() => {
            Promise.all(data.accounts.map((account: any) => {
              const amt = account.credit !== 0 ? account.credit : account.debit;
              const entry = account.credit > 0 ? 'C' : 'D';
              return this.financeService.postSGLDataTemp(
                this.mCYear.toString(),
                'JVC',
                'JVC',
                newVcrno,
                this.formatDate(data.vcrdate),
                entry,
                account.pcode,
                account.credit,
                amt.toString(),
                account.debit,
                (account.credit * data.exchangeRate).toString(),
                (account.debit * data.exchangeRate).toString(),
                '01',
                account.desc
              ).toPromise();
            })).then(() => {
              this.financeService.updateDoc(number.toString(), 'JVNO', this.mCYear.toString()).subscribe(() => {
                alert(`${newVcrno} inserted`);
                this.goToDetailForm(newVcrno);
              });
            });
          });
      });
    } else {
      this.financeService.updateTranHead(this.mCYear.toString(), '01', 'JVC','','',  'JVC', data.vcrno, this.formatDate(data.vcrdate), data.narration, '0', '0', '0', '0', '0', data.currency.SHORTNAME, data.exchangeRate, 'BSRL-GNRL')
        .subscribe(() => {
          this.financeService.deleteSGLDataTemp(data.vcrno).subscribe(() => {
            Promise.all(data.accounts.map((account: any) => {
              const amt = account.credit !== 0 ? account.credit : account.debit;
              const entry = account.credit > 0 ? 'C' : 'D';
              return this.financeService.postSGLDataTemp(
                this.mCYear.toString(),
                'JVC',
                'JVC',
                data.vcrno,
                this.formatDate(data.vcrdate),
                entry,
                account.pcode,
                account.credit,
                amt.toString(),
                account.debit,
                (account.credit * data.exchangeRate).toString(),
                (account.debit * data.exchangeRate).toString(),
                '01',
                account.desc
              ).toPromise();
            })).then(() => {
              alert(`${data.vcrno} updated`);
              this.goToDetailForm(data.vcrno);
            });
          });
        });
    }
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

  get f(){
    return this.jvForm.controls;
  }

  get accounts(): FormArray {
    return this.jvForm.get('accounts') as FormArray
  }

  searchAccount(i: number) {
    this.selectedAccountIndex = i;
    this.selectedRowIndex = 0;
  
    let dialogRef = this.dialog.open(this.accountLookupDialog, {
      width: '80vw',
      maxHeight: '80vh',
    });
  
    this.accountList = [];
  }
  
  quickAccountSearch(search: string) {
    console.log('Searching for:', search);
    this.accountService.searchOpbal(this.mCYear.toString(), search, 'C').subscribe(
      (res: any) => {
        this.accountList = res.recordset;
        this.selectedRowIndex = 0; // Reset selection on new results
      },
      (err: any) => {
        console.error('Search Error:', err);
      }
    );
  }
  
  // Navigate Down
  arrowDownEvent() {
    if (this.selectedRowIndex < this.accountList.length - 1) {
      this.selectedRowIndex++;
    }
  }
  
  // Navigate Up
  arrowUpEvent() {
    if (this.selectedRowIndex > 0) {
      this.selectedRowIndex--;
    }
  }
  
  // Select the Current Account
  selectAccount(acc: any, index: number) {
    console.log()
    if (acc) {
      this.accounts.at(index).patchValue({
        pcode: acc.PCODE,
        custname: acc.CUST_NAME,
      });
      this.dialog.closeAll();
    }
  }
  
  
  // Highlight Row (for click)
  highlight(index: number) {
    this.selectedRowIndex = index;
  }
}
