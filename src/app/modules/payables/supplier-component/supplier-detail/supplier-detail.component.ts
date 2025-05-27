import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountsService } from 'src/app/services/accounts/accounts.service';
import { DataSharingService } from 'src/app/services/data-sharing/data-sharing.service';
import { ReportsService } from 'src/app/services/reports/reports.service';

import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { FinanceService } from 'src/app/services/finance/finance.service';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY?: number;
    };
  }
}

@Component({
  selector: 'app-supplier-detail',
  templateUrl: './supplier-detail.component.html',
  styleUrls: ['./supplier-detail.component.scss']
})
export class SupplierDetailComponent {
  currentYear = new Date().getFullYear()
  mCurDate = this.formatDate(new Date())

  glCode = localStorage.getItem('glCode')!

  @ViewChild('SupplierLookupDialog', { static: false }) SupplierLookupDialog!: TemplateRef<any>;
  @ViewChild('soaLookupDialog', { static: false }) soaLookupDialog!: TemplateRef<any>;

  titleList: any[] = []
  branchList: any[] = []
  accCategoryList: any[] = []
  accTypeList: any[] = []
  SupplierSearchList: any[] = []
  SupplierList: any[] = []

  soaData: any[] = []
  totalDebit = 0;
  totalCredit = 0;
  closingBalance = 0;

  ageingSummary = {
    '60_DAYS': 0,
    '120_DAYS': 0,
    '180_DAYS': 0,
    '365_DAYS': 0,
    'ABOVE_365_DAYS': 0,
    'FUTURE_REMIT': 0
  };
  unallocPaySummary = {
    '60_DAYS': 0,
    '120_DAYS': 0,
    '180_DAYS': 0,
    '365_DAYS': 0,
    'ABOVE_365_DAYS': 0,
    'FUTURE_REMIT': 0
  };

  searchText = ''

  public supForm: FormGroup;

  constructor(private financeService: FinanceService, private route: ActivatedRoute, private dialog: MatDialog, private router: Router, private accountService: AccountsService, private reportService: ReportsService, private dataSharingService: DataSharingService) { 
    this.supForm = new FormGroup({
      pcode: new FormControl('', [ Validators.required]),
      title: new FormControl('', [ Validators.required]),
      supName: new FormControl('', [ Validators.required]),
      supCR: new FormControl('', [ Validators.required]),
      supStatus: new FormControl('', [ Validators.required]),
      supTaxNo: new FormControl('', [ Validators.required]),
      supBranch: new FormControl('', [ Validators.required]),
      supAccountType: new FormControl('', [ Validators.required]),
      supAccountCategory: new FormControl('', [ Validators.required]),
      supPhone1: new FormControl('', [ Validators.required]),
      supPhone2: new FormControl('', [ Validators.required]),
      mobile: new FormControl('', [ Validators.required]),
      supEmail: new FormControl('', [ Validators.required]),
      supAdd1: new FormControl('', [ Validators.required]),
      supAdd2: new FormControl('', [ Validators.required]),
      supAdd3: new FormControl('', [ Validators.required]),
      remarks: new FormControl('', [ Validators.required]),
      opbal: new FormControl('', [ Validators.required]),
      division: new FormControl('', [ Validators.required]),
      salesCat: new FormControl('', [ Validators.required]),
      organisation: new FormControl('', [ Validators.required]),
      industry: new FormControl('', [ Validators.required]),
      contacts: new FormArray([]),
    });
    this.accountService.listOpbal(this.currentYear.toString(),'S').subscribe((res: any) => {
      console.log(res.recordset)
      this.SupplierList = res.recordset;
    }, (error: any) => {
      console.log(error);
    });
    /*const contact = new FormGroup({
      contactId: new FormControl('', [ Validators.required]),
      contactPerson: new FormControl('', [ Validators.required]),
      contactMobile: new FormControl('', [ Validators.required]),
      contactPhone1: new FormControl('', [ Validators.required]),
      contactPhone2: new FormControl('', [ Validators.required]),
      contactEmail: new FormControl('', [ Validators.required]),
      contactAddress1: new FormControl('', [ Validators.required]),
      contactAddress2: new FormControl('', [ Validators.required]),
      contactAddress3: new FormControl('', [ Validators.required]),
    });
    this.contacts.push(contact);*/
    this.accountService.getTitle().subscribe((res: any) => {
      console.log(res)
      this.titleList = res.recordset
    }, (error: any) => {
      console.log(error)
    })
    this.accountService.getBranch().subscribe((res: any) => {
      console.log(res)
      this.branchList = res.recordset
    }, (error: any) => {
      console.log(error)
    })
    this.accountService.getAccountCategory().subscribe((res: any) => {
      console.log(res)
      this.accCategoryList = res.recordset
    }, (error: any) => {
      console.log(error)
    })
    this.accountService.getCustomerAccountType().subscribe((res: any) => {
      console.log(res)
      this.accTypeList = res.recordset
    }, (error: any) => {
      console.log(error)
    })
    this.glCode = this.dataSharingService.getData()
  }

  addContact() {
    const index = this.contacts.length + 1;
    const contact = new FormGroup({
      contactId: new FormControl('', [ Validators.required]),
      contactPerson: new FormControl('', [ Validators.required]),
      contactMobile: new FormControl('', [ Validators.required]),
      contactPhone1: new FormControl('', [ Validators.required]),
      contactPhone2: new FormControl('', [ Validators.required]),
      contactEmail: new FormControl('', [ Validators.required]),
      contactAddress1: new FormControl('', [ Validators.required]),
      contactAddress2: new FormControl('', [ Validators.required]),
      contactAddress3: new FormControl('', [ Validators.required]),
    });
    this.contacts.push(contact);
  }

  deleteContact(index: number) {
    // Show confirmation alert
    if (confirm("Are you sure you want to delete this contact?")) {
      console.log(this.contacts.at(index));
  
      // Call deleteParty function
      this.accountService.deleteParty(this.contacts.at(index).value.contactId).subscribe(
        (response) => {
          alert("Contact deleted successfully!"); // Success alert
          window.location.reload(); // Reload page to fetch updated details
        },
        (error) => {
          console.error("Error deleting contact:", error);
          alert("Failed to delete contact. Please try again.");
        }
      );
    }
  }

  newForm(){
    this.supForm = new FormGroup({
      pcode: new FormControl(this.glCode, [ Validators.required]),
      title: new FormControl('', [ Validators.required]),
      supName: new FormControl('', [ Validators.required]),
      supCR: new FormControl('', [ Validators.required]),
      supStatus: new FormControl('', [ Validators.required]),
      supTaxNo: new FormControl('', [ Validators.required]),
      supBranch: new FormControl('', [ Validators.required]),
      supAccountType: new FormControl('', [ Validators.required]),
      supAccountCategory: new FormControl('', [ Validators.required]),
      supPhone1: new FormControl('', [ Validators.required]),
      supPhone2: new FormControl('', [ Validators.required]),
      mobile: new FormControl('', [ Validators.required]),
      supEmail: new FormControl('', [ Validators.required]),
      supAdd1: new FormControl('', [ Validators.required]),
      supAdd2: new FormControl('', [ Validators.required]),
      supAdd3: new FormControl('', [ Validators.required]),
      remarks: new FormControl('', [ Validators.required]),
      opbal: new FormControl('', [ Validators.required]),
      division: new FormControl('', [ Validators.required]),
      salesCat: new FormControl('', [ Validators.required]),
      organisation: new FormControl('', [ Validators.required]),
      industry: new FormControl('', [ Validators.required]),
      contacts: new FormArray([]),
    });
    /*const contact = new FormGroup({
      contactId: new FormControl('', [ Validators.required]),
      contactPerson: new FormControl('', [ Validators.required]),
      contactMobile: new FormControl('', [ Validators.required]),
      contactPhone1: new FormControl('', [ Validators.required]),
      contactPhone2: new FormControl('', [ Validators.required]),
      contactEmail: new FormControl('', [ Validators.required]),
      contactAddress1: new FormControl('', [ Validators.required]),
      contactAddress2: new FormControl('', [ Validators.required]),
      contactAddress3: new FormControl('', [ Validators.required]),
    });
    this.contacts.push(contact);*/
  }

  copyToContact(){
    const data = this.supForm.value
    const contact = new FormGroup({
      contactId: new FormControl(data.pcode, [ Validators.required]),
      contactPerson: new FormControl(data.supName, [ Validators.required]),
      contactMobile: new FormControl(data.mobile, [ Validators.required]),
      contactPhone1: new FormControl(data.supPhone1, [ Validators.required]),
      contactPhone2: new FormControl(data.supPhone2, [ Validators.required]),
      contactEmail: new FormControl(data.supEmail, [ Validators.required]),
      contactAddress1: new FormControl(data.supAdd1, [ Validators.required]),
      contactAddress2: new FormControl(data.supAdd2, [ Validators.required]),
      contactAddress3: new FormControl(data.supAdd3, [ Validators.required]),
    });
    this.contacts.push(contact);
  }

  searchSupplier() {
    let dialogRef = this.dialog.open(this.SupplierLookupDialog, {
      width: '80vw',  // 80% of viewport width
      maxHeight: '80vh',  // 80% of viewport height
    });
    this.SupplierSearchList = []
  }

  quickSupplierSearch(search: string) {
    console.log(search)
    this.accountService.searchOpbal(this.currentYear.toString(),search,'S').subscribe((res: any) => {
      this.SupplierSearchList = res.recordset
      }, (err: any) => {
      console.log(err)
    })
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const pcode = params['pcode'];
      console.log("Navigated to PCODE:", pcode);
      this.loadSupplierDetails(pcode);
    });
  }

  loadSupplierDetails(pcode: string) {
    if (pcode === 'new') {
      this.newForm();
    } else if (pcode === '*') {
      this.clearForm
    } else {
      this.getDetails(pcode);
    }
  }

  clearForm(){
    this.supForm = new FormGroup({
      pcode: new FormControl('', [ Validators.required]),
      title: new FormControl('', [ Validators.required]),
      supName: new FormControl('', [ Validators.required]),
      supCR: new FormControl('', [ Validators.required]),
      supStatus: new FormControl('', [ Validators.required]),
      supTaxNo: new FormControl('', [ Validators.required]),
      supBranch: new FormControl('', [ Validators.required]),
      supAccountType: new FormControl('', [ Validators.required]),
      supAccountCategory: new FormControl('', [ Validators.required]),
      supPhone1: new FormControl('', [ Validators.required]),
      supPhone2: new FormControl('', [ Validators.required]),
      mobile: new FormControl('', [ Validators.required]),
      supEmail: new FormControl('', [ Validators.required]),
      supAdd1: new FormControl('', [ Validators.required]),
      supAdd2: new FormControl('', [ Validators.required]),
      supAdd3: new FormControl('', [ Validators.required]),
      remarks: new FormControl('', [ Validators.required]),
      opbal: new FormControl('', [ Validators.required]),
      division: new FormControl('', [ Validators.required]),
      salesCat: new FormControl('', [ Validators.required]),
      organisation: new FormControl('', [ Validators.required]),
      industry: new FormControl('', [ Validators.required]),
      contacts: new FormArray([]),
    });
    this.accountService.listOpbal(this.currentYear.toString(),'S').subscribe((res: any) => {
      console.log(res.recordset)
      this.SupplierList = res.recordset;
    }, (error: any) => {
      console.log(error);
    });
  }

  getDetails(pcode: string) {
    this.accountService.getOpbal(this.currentYear.toString(), pcode).subscribe((res: any) => {
      console.log(res)
      this.supForm = new FormGroup({
        pcode: new FormControl(res.recordset[0].PCODE, [ Validators.required]),
        title: new FormControl(res.recordset[0].TITLE_CD, [ Validators.required]),
        supName: new FormControl(res.recordset[0].CUST_NAME, [ Validators.required]),
        supCR: new FormControl(res.recordset[0].CR_CPR, [ Validators.required]),
        supStatus: new FormControl(res.recordset[0].STATUS, [ Validators.required]),
        supTaxNo: new FormControl(res.recordset[0].TAX_1_NO, [ Validators.required]),
        supBranch: new FormControl(res.recordset[0].BRANCH_NAME, [ Validators.required]),
        supAccountType: new FormControl(res.recordset[0].Customertype, [ Validators.required]),
        supAccountCategory: new FormControl(res.recordset[0].ACCOUNT_CATEGORY_DESC, [ Validators.required]),
        supPhone1: new FormControl(res.recordset[0].PHONE1, [ Validators.required]),
        supPhone2: new FormControl(res.recordset[0].PHONE2, [ Validators.required]),
        mobile: new FormControl(res.recordset[0].MOBILE, [ Validators.required]),
        supEmail: new FormControl(res.recordset[0].EMAIL, [ Validators.required]),
        supAdd1: new FormControl(res.recordset[0].ADD1, [ Validators.required]),
        supAdd2: new FormControl(res.recordset[0].ADD2, [ Validators.required]),
        supAdd3: new FormControl(res.recordset[0].ADD3, [ Validators.required]),
        remarks: new FormControl(res.recordset[0].REMARKS, [ Validators.required]),
        opbal: new FormControl(res.recordset[0].OPBAL, [ Validators.required]),
        division: new FormControl(res.recordset[0].SUBCATEGORY, [ Validators.required]),
        salesCat: new FormControl(res.recordset[0].Salessubcategory, [ Validators.required]),
        organisation: new FormControl(res.recordset[0].Orgnisation, [ Validators.required]),
        industry: new FormControl(res.recordset[0].Industry, [ Validators.required]),
        contacts: new FormArray([]),
      });
      this.accountService.getParty(res.recordset[0].PCODE).subscribe((resp: any) => {
        console.log(resp)
        for(let i=0;i<resp.recordset.length; i++){
          const contact = new FormGroup({
            contactId: new FormControl(resp.recordset[i].PARTY_ID, [ Validators.required]),
            contactPerson: new FormControl(resp.recordset[i].NAME, [ Validators.required]),
            contactMobile: new FormControl(resp.recordset[i].MOBILE, [ Validators.required]),
            contactPhone1: new FormControl(resp.recordset[i].PHONE1, [ Validators.required]),
            contactPhone2: new FormControl(resp.recordset[i].PHONE2, [ Validators.required]),
            contactEmail: new FormControl(resp.recordset[i].EMAIL_ID, [ Validators.required]),
            contactAddress1: new FormControl(resp.recordset[i].ADD1, [ Validators.required]),
            contactAddress2: new FormControl(resp.recordset[i].ADD2, [ Validators.required]),
            contactAddress3: new FormControl(resp.recordset[i].ADD3, [ Validators.required]),
          });
          this.contacts.push(contact);
        }
      }, (erro: any) => {
        console.log(erro)
      })
    }, (err: any) => {
      console.log(err)
    })
  }

  goToDetailForm(pcode: string, route: string) {
    this.dialog.closeAll();  // Close modal if open
    if (route === 'Supplier') {
      this.router.navigate(['receivables/Supplier/detail', pcode]);
    } else if (route === 'contact') {
      this.router.navigate(['receivables/contact/detail', pcode]);
    }
  }

  submitForm() {
    const data = this.supForm.value
    console.log(data)
    this.accountService.getOpbal(this.currentYear.toString(), data.pcode).subscribe((res: any) => {
      if(res.recordset.length === 0) {
        /////INSERT
        this.accountService.postOpbal(data.pcode, data.title, data.supName, 'S', data.supAdd1, data.supAdd2, data.supAdd3, data.supPhone1, data.supPhone2, data.supEmail, data.mobile, this.glCode, data.supStatus, data.remarks, data.supTaxNo, data.supBranch, data.supAccountType, data.supAccountCategory, data.supCR,this.currentYear.toString(),data.opbal).subscribe(() => {
          alert(`Supplier successfully inserted!`);
            this.goToDetailForm(data.pcode,'Supplier'); // Navigate to detail page
          },(error) => {
            console.error(`Failed to insert Supplier:`, error);
            alert(`Error: Could not insert Supplier.`);
          }
        );
      } else {
        /////UPDATE
        this.accountService.updateOpbal(data.pcode, data.title, data.supName, 'S', data.supAdd1, data.supAdd2, data.supAdd3, data.supPhone1, data.supPhone2, data.supEmail, data.mobile, this.glCode, data.supStatus, data.remarks, data.supTaxNo, data.supBranch, data.supAccountType, data.supAccountCategory, data.supCR,this.currentYear.toString(),data.opbal).subscribe(() => {
          alert(`Supplier successfully updated!`);
            this.goToDetailForm(data.pcode,'Supplier'); // Navigate to detail page
          },(error) => {
            console.error(`Failed to update Supplier:`, error);
            alert(`Error: Could not update Supplier.`);
          }
        );
      }
    }, (err: any) => {
      /////INSERT
      this.accountService.postOpbal(data.pcode, data.title, data.supName, 'S', data.supAdd1, data.supAdd2, data.supAdd3, data.supPhone1, data.supPhone2, data.supEmail, data.mobile, this.glCode, data.supStatus, data.remarks, data.supTaxNo, data.supBranch, data.supAccountType, data.supAccountCategory, data.supCR,this.currentYear.toString(),data.opbal).subscribe(() => {
        alert(`Supplier successfully inserted!`);
          this.goToDetailForm(data.pcode,'Supplier'); // Navigate to detail page
        },(error) => {
          console.error(`Failed to insert Supplier:`, error);
          alert(`Error: Could not insert Supplier.`);
        }
      );
    })
  }

  getSupplierSoa(){
    this.totalDebit = 0;
    this.totalCredit = 0;
    this.closingBalance = 0;
    this.ageingSummary = {
      '60_DAYS': 0,
      '120_DAYS': 0,
      '180_DAYS': 0,
      '365_DAYS': 0,
      'ABOVE_365_DAYS': 0,
      'FUTURE_REMIT': 0
    };
    this.unallocPaySummary = {
      '60_DAYS': 0,
      '120_DAYS': 0,
      '180_DAYS': 0,
      '365_DAYS': 0,
      'ABOVE_365_DAYS': 0,
      'FUTURE_REMIT': 0
    };
    const data = this.supForm.value
    let dialogRef = this.dialog.open(this.soaLookupDialog);
    this.reportService.getCustomerSoa('S', data.pcode).subscribe((res: any) => {
    console.log(res.recordset);
    this.soaData = res.recordset;
    let runningBalance = 0;

    this.soaData = this.soaData.map(row => {
      const debit = Number(row.DEBIT) || 0;
      const credit = Number(row.CREDIT) || 0;
      this.totalDebit += debit;
      this.totalCredit += credit;

      runningBalance += credit -  debit;

      let daysDiff: number | null = null;

      // Only calculate overdue if there's a debit and it's not fully offset
      if ((debit - credit) > 0) {
        const dueDate = new Date(row.DUEDATE);
        const today = new Date();

        dueDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - dueDate.getTime()
        daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
      }

      return {
        ...row,
        BALANCE: runningBalance,
        DAYS_DIFF: daysDiff // could be null if not applicable
      };
    });
    this.soaData.forEach(row => {
      const debit = Number(row.DEBIT) || 0;
      const credit = Number(row.CREDIT) || 0;
      const diff = Number(row.DAYS_DIFF);
      if (debit > 0) {
        if (diff < 0) {
          this.ageingSummary.FUTURE_REMIT += debit;
        } else if (diff <= 60) {
          this.ageingSummary['60_DAYS'] += debit;
        } else if (diff <= 120) {
          this.ageingSummary['120_DAYS'] += debit;
        } else if (diff <= 180) {
          this.ageingSummary['180_DAYS'] += debit;
        } else if (diff <= 365) {
          this.ageingSummary['365_DAYS'] += debit;
        } else {
          this.ageingSummary['ABOVE_365_DAYS'] += debit;
        }
      }
      if (credit > 0) {
        if (diff < 0) {
          this.unallocPaySummary.FUTURE_REMIT += credit;
        } else if (diff <= 60) {
          this.unallocPaySummary['60_DAYS'] += credit;
        } else if (diff <= 120) {
          this.unallocPaySummary['120_DAYS'] += credit;
        } else if (diff <= 180) {
          this.unallocPaySummary['180_DAYS'] += credit;
        } else if (diff <= 365) {
          this.unallocPaySummary['365_DAYS'] += credit;
        } else {
          this.unallocPaySummary['ABOVE_365_DAYS'] += credit;
        }
      }
    });
  });

  }

  printCOA(type: string) {
    const data = this.supForm.value
    console.log(this.soaData); // Check the structure of chartData for debugging
    var doc = new jsPDF("portrait", "px", "a4");
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Statement of Accounts', 160, 20);
    doc.roundedRect(5, 32.5, 436, 55, 5, 5);
    doc.setFontSize(10);
    doc.text(`${data.supName}`,10,42);
    doc.text(`Date: ${this.mCurDate}`,375,42);
    doc.setFont('Helvetica', 'normal');
    doc.text('Account ID',10,52);
    doc.text(`: ${data.pcode} (${data.supAccountType})`,65,52);
    doc.text('Division',10,62);
    doc.text(`: ${data.division}`,65,62);
    doc.text('Sales Category',150,62);
    doc.text(`: ${data.salesCat}`,205,62);
    doc.text('Organisation',10,72);
    doc.text(`: ${data.organisation}`,65,72);
    doc.text('Country',10,82);
    doc.text(`: ${data.supAccountCategory}`,65,82);
    let firstPageStartY = 90; // Start Y position for first page
    let nextPagesStartY = 35; // Start Y position for subsequent pages
    let firstPage = true;      // Flag to check if it's the first page

    autoTable(doc, {
        html: '#soaTable',
        //startY: firstPage ? firstPageStartY : nextPagesStartY,
        tableWidth: 435,
        //margin: { left: 5 },
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
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' }
        },
        margin: { 
          top: firstPage ? firstPageStartY : nextPagesStartY,
          left: 5
        },
        didDrawPage: function () {
          firstPage = false;
        }
      });

    if(type == 'D') {
      
      let finalY1 = doc.lastAutoTable?.finalY || 0
  
      autoTable(doc, {
        html: '#ageingSummaryTable',
        startY: finalY1 + 5,
        tableWidth: 435,
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
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' }
        }
      });
 
      let finalY2 = doc.lastAutoTable?.finalY || 0
  
      autoTable(doc, {
        html: '#unallocPayTable',
        startY: finalY2 + 5,
        tableWidth: 435,
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
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' }
        }
      });
    } else {
      /*autoTable(doc, {
        html: '#soaTable',
        //startY: firstPageStartY,
        tableWidth: 435,
        //margin: { left: 10 },
        styles: { fontSize: 8 },
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          4: { halign: 'right' }, // Amount
          5: { halign: 'right' }, // Debit
          6: { halign: 'right' }, // Credit
          7: { halign: 'right' }  // Balance
        },
        footStyles:{
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        theme: 'striped',
        didDrawPage: function () {
          let totalPages = (doc.internal as any).getNumberOfPages(); // Type assertion to 'any'
          if (!firstPage) {
            //doc.setPage(totalPages);
            //doc.setFontSize(10);
            //doc.setTextColor(100);
            //doc.text(Continued..., 10, nextPagesStartY - 10);
          }
          firstPage = false;
        },
        margin: { 
          top: firstPage ? firstPageStartY : nextPagesStartY,
          left: 5
        } // Dynamically adjust margin
      });*/
    }


    // Add watermark (if necessary)
    doc = this.addWaterMark(doc);
    // Save the PDF
    doc.save(`${data.pcode}-statement-of-accounts-${this.mCurDate}.pdf`);
    }

    addWaterMark(doc: any) {
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
        doc.setFontSize(8)
        doc.setFont('Helvetica','bold');
        var img2 = new Image()
        img2.src = 'assets/pics/favicon.png';
        doc.addImage(img2, 'png', 2, 619, 7.5, 7.5);
        doc.text('IFAGATE',10,625);
        doc.setFont('Helvetica','normal');
        doc.text(`Page ${i} of ${totalPages}`,400,625);
      }
      return doc;
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
    return this.supForm.controls;
  }

  get contacts(): FormArray {
    return this.supForm.get('contacts') as FormArray
  }
}
