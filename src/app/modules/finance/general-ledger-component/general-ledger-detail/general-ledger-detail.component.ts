import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountsService } from 'src/app/services/accounts/accounts.service';
import { DataSharingService } from 'src/app/services/data-sharing/data-sharing.service';
import { FinanceService } from 'src/app/services/finance/finance.service';

@Component({
  selector: 'app-general-ledger-detail',
  templateUrl: './general-ledger-detail.component.html',
  styleUrls: ['./general-ledger-detail.component.scss']
})
export class GeneralLedgerDetailComponent {
  
    currentYear = new Date().getFullYear()
  
    @ViewChild('SubLedgerLookupDialog', { static: false }) SubLedgerLookupDialog!: TemplateRef<any>;
  
    tabs = ['Assets', 'Liabilities', 'Income', 'Expenses', 'Equity'];
    maingroups = ['A', 'L', 'I', 'X', 'E'];
    subGroup: any[] = []
    titleList: any[] = []
    branchList: any[] = []
    accGroupList: any[] = []
    accCategoryList: any[] = []
    accTypeList: any[] = []
    subLedgerList: any[] = []
  
    public subLedgerForm: FormGroup;
  
    constructor(private financeService: FinanceService, private route: ActivatedRoute, private dialog: MatDialog, private router: Router, private accountService: AccountsService, private dataSharingService: DataSharingService) { 
      this.subLedgerForm  = new FormGroup({
        maingroup:new FormControl('', [ Validators.required]),
        subgroup:new FormControl('', [ Validators.required]),
        subLedAccountGroup: new FormControl('', [ Validators.required]),
        pcode: new FormControl('', [ Validators.required]),
        subLedName: new FormControl('', [ Validators.required]),
        subLedStatus: new FormControl('', [ Validators.required]),
        subLedBranch: new FormControl('', [ Validators.required]),
        subLedAccountType: new FormControl('', [ Validators.required]),
        subLedAccountCategory: new FormControl('', [ Validators.required]),
        type: new FormControl('', [ Validators.required]),
        opbal: new FormControl('', [ Validators.required]),
        remarks: new FormControl('', [ Validators.required]),
      });
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
    }
  
    newForm(){
      this.subLedgerForm  = new FormGroup({
        maingroup:new FormControl('', [ Validators.required]),
        subgroup:new FormControl('', [ Validators.required]),
        subLedAccountGroup: new FormControl('', [ Validators.required]),
        pcode: new FormControl('', [ Validators.required]),
        subLedName: new FormControl('', [ Validators.required]),
        subLedStatus: new FormControl('', [ Validators.required]),
        subLedBranch: new FormControl('', [ Validators.required]),
        subLedAccountType: new FormControl('', [ Validators.required]),
        subLedAccountCategory: new FormControl('', [ Validators.required]),
        opbal: new FormControl('0', [ Validators.required]),
        type: new FormControl('', [ Validators.required]),
        remarks: new FormControl('', [ Validators.required]),
      });
    }

    getSubGroup(maingroup: string){
      this.financeService.getSubGroup(maingroup).subscribe(
        (res: any) => {
          this.subGroup = res.recordset
        },
        (err: any) => {
          console.log(err);
        }
      );
    }

    getGlCode(subgroup: string) {
      this.financeService.getGLCode(subgroup).subscribe(
        (res: any) => {
          console.log(res)
          this.accGroupList = res.recordset; // Store the GL Codes
        },
        (err: any) => {
          console.log(err);
        }
      );
    }

    patchGlcode(glcode: string){
      this.subLedgerForm.patchValue({
        pcode: glcode
      })
    }
  
    searchSubLedger() {
      let dialogRef = this.dialog.open(this.SubLedgerLookupDialog, {
        width: '80vw',  // 80% of viewport width
        maxHeight: '80vh',  // 80% of viewport height
      });
      this.subLedgerList = []
    }
  
    quickSubLedgerSearch(search: string) {
      console.log(search)
      this.accountService.searchOpbal(this.currentYear.toString(),search,'G').subscribe((res: any) => {
        this.subLedgerList = res.recordset
        }, (err: any) => {
        console.log(err)
      })
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
      if (pcode === 'new') {
        this.newForm();
      } else {
        this.accountService.getOpbal(this.currentYear.toString(), pcode).subscribe((res: any) => {
          console.log(res)
          this.subLedgerForm  = new FormGroup({
            maingroup:new FormControl(res.recordset[0].GLCODE.charAt(0), [ Validators.required]),
            subgroup:new FormControl(res.recordset[0].GLCODE.substring(0,2), [ Validators.required]),
            pcode: new FormControl(res.recordset[0].PCODE, [ Validators.required]),
            subLedName: new FormControl(res.recordset[0].CUST_NAME, [ Validators.required]),
            subLedStatus: new FormControl(res.recordset[0].STATUS, [ Validators.required]),
            subLedBranch: new FormControl(res.recordset[0].BRANCH_ID, [ Validators.required]),
            subLedAccountType: new FormControl(res.recordset[0].ACCOUNT_TYPE_CD, [ Validators.required]),
            subLedAccountGroup: new FormControl(res.recordset[0].GLCODE, [ Validators.required]),
            subLedAccountCategory: new FormControl(res.recordset[0].ACCOUNT_CATEGORY_CD, [ Validators.required]),
            opbal: new FormControl(res.recordset[0].OPBAL, [ Validators.required]),
            type: new FormControl(res.recordset[0].TYPE, [ Validators.required]),
            remarks: new FormControl(res.recordset[0].REMARKS, [ Validators.required]),
          });
          this.getSubGroup(res.recordset[0].GLCODE.charAt(0))
          this.getGlCode(res.recordset[0].GLCODE.substring(0,2))
        }, (err: any) => {
          console.log(err)
        })
      }
    }
  
    goToDetailForm(pcode: string) {
      this.dialog.closeAll();  // Close the dialog before navigation
      this.router.navigate(['finance/general-ledger/detail', pcode]);
    }
    
    submitForm() {
      const data = this.subLedgerForm .value
      console.log(data)
      this.accountService.getOpbal(this.currentYear.toString(), data.pcode).subscribe((res: any) => {
        if(res.recordset.length === 0) {
          /////INSERT
          this.accountService.postOpbal(data.pcode, data.title, data.subLedName, 'G', '', '', '', '', '', '', '', data.subLedAccountGroup, data.subLedStatus, data.remarks, '', data.subLedBranch, data.subLedAccountType, data.subLedAccountCategory, '',this.currentYear.toString(),data.opbal).subscribe(() => {
            alert(`SubLedger successfully inserted!`);
              this.goToDetailForm(data.pcode); // Navigate to detail page
            },(error) => {
              console.error(`Failed to insert SubLedger:`, error);
              alert(`Error: Could not insert SubLedger.`);
            }
          );
        } else {
          /////UPDATE
          this.accountService.updateOpbal(data.pcode, data.title, data.subLedName, 'G', '', '', '', '', '', '', '', data.subLedAccountGroup, data.subLedStatus, data.remarks, '', data.subLedBranch, data.subLedAccountType, data.subLedAccountCategory, '',this.currentYear.toString(),data.opbal).subscribe(() => {
            alert(`SubLedger successfully updated!`);
              this.goToDetailForm(data.pcode); // Navigate to detail page
            },(error) => {
              console.error(`Failed to update SubLedger:`, error);
              alert(`Error: Could not update SubLedger.`);
            }
          );
        }
      }, (err: any) => {
        /////INSERT
        this.accountService.postOpbal(data.pcode, data.title, data.subLedName, 'G', '', '', '', '', '', '', '', data.subLedAccountGroup, data.subLedStatus, data.remarks, '', data.subLedBranch, data.subLedAccountType, data.subLedAccountCategory, '',this.currentYear.toString(),data.opbal).subscribe(() => {
          alert(`SubLedger successfully inserted!`);
            this.goToDetailForm(data.pcode); // Navigate to detail page
          },(error) => {
            console.error(`Failed to insert SubLedger:`, error);
            alert(`Error: Could not insert SubLedger.`);
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
      return this.subLedgerForm .controls;
    }
  }
  