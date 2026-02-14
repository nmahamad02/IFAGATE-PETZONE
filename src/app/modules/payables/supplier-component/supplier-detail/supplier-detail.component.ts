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
      '30_DAYS': 0,
      '60_DAYS': 0,
      '90_DAYS': 0,
      '120_DAYS': 0,
      'ABOVE_120_DAYS': 0,
      'CURRENT': 0
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
  
    public suppForm: FormGroup;
  
    constructor(private financeService: FinanceService, private route: ActivatedRoute, private dialog: MatDialog, private router: Router, private accountService: AccountsService, private reportService: ReportsService, private dataSharingService: DataSharingService) { 
      this.suppForm = new FormGroup({
        pcode: new FormControl('', [ Validators.required]),
        title: new FormControl('', [ Validators.required]),
        suppName: new FormControl('', [ Validators.required]),
        suppCR: new FormControl('', [ Validators.required]),
        suppStatus: new FormControl('', [ Validators.required]),
        suppTaxNo: new FormControl('', [ Validators.required]),
        suppBranch: new FormControl('', [ Validators.required]),
        suppAccountType: new FormControl('', [ Validators.required]),
        suppAccountCategory: new FormControl('', [ Validators.required]),
        suppPhone1: new FormControl('', [ Validators.required]),
        suppPhone2: new FormControl('', [ Validators.required]),
        mobile: new FormControl('', [ Validators.required]),
        suppEmail: new FormControl('', [ Validators.required]),
        suppAdd1: new FormControl('', [ Validators.required]),
        suppAdd2: new FormControl('', [ Validators.required]),
        suppAdd3: new FormControl('', [ Validators.required]),
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
      this.suppForm = new FormGroup({
        pcode: new FormControl(this.glCode, [ Validators.required]),
        title: new FormControl('', [ Validators.required]),
        suppName: new FormControl('', [ Validators.required]),
        suppCR: new FormControl('', [ Validators.required]),
        suppStatus: new FormControl('', [ Validators.required]),
        suppTaxNo: new FormControl('', [ Validators.required]),
        suppBranch: new FormControl('', [ Validators.required]),
        suppAccountType: new FormControl('', [ Validators.required]),
        suppAccountCategory: new FormControl('', [ Validators.required]),
        suppPhone1: new FormControl('', [ Validators.required]),
        suppPhone2: new FormControl('', [ Validators.required]),
        mobile: new FormControl('', [ Validators.required]),
        suppEmail: new FormControl('', [ Validators.required]),
        suppAdd1: new FormControl('', [ Validators.required]),
        suppAdd2: new FormControl('', [ Validators.required]),
        suppAdd3: new FormControl('', [ Validators.required]),
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
      const data = this.suppForm.value
      const contact = new FormGroup({
        contactId: new FormControl(data.pcode, [ Validators.required]),
        contactPerson: new FormControl(data.suppName, [ Validators.required]),
        contactMobile: new FormControl(data.mobile, [ Validators.required]),
        contactPhone1: new FormControl(data.suppPhone1, [ Validators.required]),
        contactPhone2: new FormControl(data.suppPhone2, [ Validators.required]),
        contactEmail: new FormControl(data.suppEmail, [ Validators.required]),
        contactAddress1: new FormControl(data.suppAdd1, [ Validators.required]),
        contactAddress2: new FormControl(data.suppAdd2, [ Validators.required]),
        contactAddress3: new FormControl(data.suppAdd3, [ Validators.required]),
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
      this.suppForm = new FormGroup({
        pcode: new FormControl('', [ Validators.required]),
        title: new FormControl('', [ Validators.required]),
        suppName: new FormControl('', [ Validators.required]),
        suppCR: new FormControl('', [ Validators.required]),
        suppStatus: new FormControl('', [ Validators.required]),
        suppTaxNo: new FormControl('', [ Validators.required]),
        suppBranch: new FormControl('', [ Validators.required]),
        suppAccountType: new FormControl('', [ Validators.required]),
        suppAccountCategory: new FormControl('', [ Validators.required]),
        suppPhone1: new FormControl('', [ Validators.required]),
        suppPhone2: new FormControl('', [ Validators.required]),
        mobile: new FormControl('', [ Validators.required]),
        suppEmail: new FormControl('', [ Validators.required]),
        suppAdd1: new FormControl('', [ Validators.required]),
        suppAdd2: new FormControl('', [ Validators.required]),
        suppAdd3: new FormControl('', [ Validators.required]),
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
        this.suppForm = new FormGroup({
          pcode: new FormControl(res.recordset[0].PCODE, [ Validators.required]),
          title: new FormControl(res.recordset[0].TITLE_CD, [ Validators.required]),
          suppName: new FormControl(res.recordset[0].CUST_NAME, [ Validators.required]),
          suppCR: new FormControl(res.recordset[0].CR_CPR, [ Validators.required]),
          suppStatus: new FormControl(res.recordset[0].STATUS, [ Validators.required]),
          suppTaxNo: new FormControl(res.recordset[0].TAX_1_NO, [ Validators.required]),
          suppBranch: new FormControl(res.recordset[0].BRANCH_NAME, [ Validators.required]),
          suppAccountType: new FormControl(res.recordset[0].Customertype, [ Validators.required]),
          suppAccountCategory: new FormControl(res.recordset[0].ACCOUNT_CATEGORY_DESC, [ Validators.required]),
          suppPhone1: new FormControl(res.recordset[0].PHONE1, [ Validators.required]),
          suppPhone2: new FormControl(res.recordset[0].PHONE2, [ Validators.required]),
          mobile: new FormControl(res.recordset[0].MOBILE, [ Validators.required]),
          suppEmail: new FormControl(res.recordset[0].EMAIL, [ Validators.required]),
          suppAdd1: new FormControl(res.recordset[0].ADD1, [ Validators.required]),
          suppAdd2: new FormControl(res.recordset[0].ADD2, [ Validators.required]),
          suppAdd3: new FormControl(res.recordset[0].ADD3, [ Validators.required]),
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
        this.router.navigate(['payables/supplier/detail', pcode]);
      } else if (route === 'contact') {
        this.router.navigate(['payables/contact/detail', pcode]);
      }
    }
  
    submitForm() {
      const data = this.suppForm.value
      console.log(data)
      this.accountService.getOpbal(this.currentYear.toString(), data.pcode).subscribe((res: any) => {
        if(res.recordset.length === 0) {
          /////INSERT
          this.accountService.postOpbal(data.pcode, data.title, data.suppName, 'S', data.suppAdd1, data.suppAdd2, data.suppAdd3, data.suppPhone1, data.suppPhone2, data.suppEmail, data.mobile, this.glCode, data.suppStatus, data.remarks, data.suppTaxNo, data.suppBranch, data.suppAccountType, data.suppAccountCategory, data.suppCR,this.currentYear.toString(),data.opbal).subscribe(() => {
            alert(`Supplier successfully inserted!`);
              this.goToDetailForm(data.pcode,'Supplier'); // Navigate to detail page
            },(error) => {
              console.error(`Failed to insert Supplier:`, error);
              alert(`Error: Could not insert Supplier.`);
            }
          );
        } else {
          /////UPDATE
          this.accountService.updateOpbal(data.pcode, data.title, data.suppName, 'S', data.suppAdd1, data.suppAdd2, data.suppAdd3, data.suppPhone1, data.suppPhone2, data.suppEmail, data.mobile, this.glCode, data.suppStatus, data.remarks, data.suppTaxNo, data.suppBranch, data.suppAccountType, data.suppAccountCategory, data.suppCR,this.currentYear.toString(),data.opbal).subscribe(() => {
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
        this.accountService.postOpbal(data.pcode, data.title, data.suppName, 'S', data.suppAdd1, data.suppAdd2, data.suppAdd3, data.suppPhone1, data.suppPhone2, data.suppEmail, data.mobile, this.glCode, data.suppStatus, data.remarks, data.suppTaxNo, data.suppBranch, data.suppAccountType, data.suppAccountCategory, data.suppCR,this.currentYear.toString(),data.opbal).subscribe(() => {
          alert(`Supplier successfully inserted!`);
            this.goToDetailForm(data.pcode,'Supplier'); // Navigate to detail page
          },(error) => {
            console.error(`Failed to insert Supplier:`, error);
            alert(`Error: Could not insert Supplier.`);
          }
        );
      })
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
      return this.suppForm.controls;
    }
  
    get contacts(): FormArray {
      return this.suppForm.get('contacts') as FormArray
    }
  }