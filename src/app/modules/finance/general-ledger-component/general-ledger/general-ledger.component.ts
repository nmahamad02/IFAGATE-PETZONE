import { Component, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FinanceService } from 'src/app/services/finance/finance.service';
import { MatDialog } from '@angular/material/dialog';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DataSharingService } from 'src/app/services/data-sharing/data-sharing.service';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';

@Component({
  selector: 'app-general-ledger',
  templateUrl: './general-ledger.component.html',
  styleUrls: ['./general-ledger.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GeneralLedgerComponent implements OnInit {

  utc = new Date();
  mCurDate = this.formatDate(this.utc);
  mCYear = new Date().getFullYear();

  @ViewChild('subGroupLookupDialog', { static: false }) subGroupLookupDialog!: TemplateRef<any>;
  @ViewChild('glCodeLookupDialog', { static: false }) glCodeLookupDialog!: TemplateRef<any>;
  @ViewChild('coaLookupDialog', { static: false }) coaLookupDialog!: TemplateRef<any>;
  @ViewChild('trialBalanceSummaryLookupDialog', { static: false }) trialBalanceSummaryLookupDialog!: TemplateRef<any>;

  // Track the selected tab index
  selectedIndex: number = 0;

  // Array of tab labels (for demonstration)
  tabs = ['Assets', 'Liabilities', 'Income', 'Expenses', 'Equity'];
  maingroups = ['A', 'L', 'I', 'X', 'E'];
  maingroupsProcessed = 0; // Declare this at the class level
  
  subGroup: any[] = []
  glAcc: any[] = []

  subGroupForm: FormGroup;
  sgMes = ''
  tempSubGroupCode = ''
  tempGlType = ''

  glCodeForm: FormGroup;
  glMes = ''

  chartData: any[] = []
  trialBalanceSummaryData: any[] = []

  searchText = ''

  constructor(private financeService: FinanceService, private dialog: MatDialog, private router: Router, private dataSharingService: DataSharingService){
    this.subGroupForm = new FormGroup({ 
      maingroupcode: new FormControl('', []),
      maingroupname: new FormControl('', []),
      subgroupcode: new FormControl('', []),
      subgroupname: new FormControl('', []), 
    });
    this.glCodeForm = new FormGroup({ 
      gl_id: new FormControl('', []),
      glcode: new FormControl('', []),
      glname: new FormControl('', []),
      subgrpcode: new FormControl('', []), 
      pl_bs: new FormControl('', []), 
      pl_bs_code: new FormControl('', []), 
    });
  }
  
  ngOnInit(): void {
    this.getSubGroup('A');
    this.fetchChartData();
  }
  
  // Handle tab change event
  onTabChange(index: number) {
    this.selectedIndex = index
    const selectedTabLabel = this.tabs[index];
    this.runApiForTab(selectedTabLabel);
    this.glAcc = []
  }

  runApiForTab(tab: string) {
    const groupCodeMap: { [key: string]: string } = {
      Assets: 'A',
      Liabilities: 'L',
      Income: 'I',
      Expenses: 'X',
      Equity: 'E',
    };
    this.getSubGroup(groupCodeMap[tab]);
  }

  getSubGroup(maingroup: string) {
    this.financeService.getSubGroup(maingroup).subscribe(
      (res: any) => {
        this.subGroup = res.recordset.map((subgrp: any) => ({
          ...subgrp,
          expanded: false, // Add expansion state
          glcodes: [], // Placeholder for GL Codes
        }));
      },
      (err: any) => {
        console.log(err);
      }
    );
  }

  getGLAcc(year: string, glcode: string){
    console.log(glcode)
    this.dataSharingService.setData(glcode)
    localStorage.setItem('glcode', JSON.stringify(glcode));
    this.financeService.getGLAccount(year,glcode).subscribe((res: any) => {
      console.log(res)
      this.tempGlType = res.recordset[0].TYPE
      this.glAcc = res.recordset
    }, (err: any) => {
      console.log(err)
    })
  }

  getCustomerType(type: string): string {
    switch (type) {
      case 'S': return 'Supplier';
      case 'C': return 'Customer';
      case 'G': return 'General';
      default: return 'Unknown';
    }
  }

  toggleSubgroup(subgrp: any) {
    console.log(subgrp)
    localStorage.setItem('subgrp', JSON.stringify(subgrp.SUBGRPCODE));
    subgrp.expanded = !subgrp.expanded;
    if (subgrp.expanded && subgrp.glcodes.length === 0) {
      this.financeService.getGLCode(subgrp.SUBGRPCODE).subscribe(
        (res: any) => {
          console.log(res)
          subgrp.glcodes = res.recordset; // Store the GL Codes
        },
        (err: any) => {
          console.log(err);
        }
      );
    }
  }

  getCOA(){
    let dialogRef = this.dialog.open(this.coaLookupDialog);
  }

  openTrialBalanceSummary(){
    let dialogRef = this.dialog.open(this.trialBalanceSummaryLookupDialog);
  }

  fetchChartData() {
    this.chartData = []; // Clear existing data
    this.maingroupsProcessed = 0; // Reset counter for each call
    
    this.maingroups.forEach(maingroup => {
      this.financeService.getSubGroup(maingroup).subscribe(
        (subgroupRes: any) => {
          let subgroupData = subgroupRes?.recordset?.map((subgrp: any) => ({
            ...subgrp,
            glcodes: [] // Placeholder for GL Codes
          })) || []; // Default to empty array on error
    
          let subgroupProcessed = 0; // Track completed subgroups
    
          subgroupData.forEach((subgroup: any) => {
            this.financeService.getGLCode(subgroup.SUBGRPCODE).subscribe(
              (glcodeRes: any) => {
                subgroup.glcodes = glcodeRes?.recordset?.map((glcode: any) => ({
                  ...glcode,
                  glaccounts: [] // Placeholder for GL Accounts
                })) || []; // Default to empty array on error
  
                let glcodeProcessed = 0; // Track completed glcodes
    
                subgroup.glcodes.forEach((glcode: any) => {
                  this.financeService.getGLAccount(this.mCYear.toString(), glcode.GLCODE).subscribe(
                    (glaccountRes: any) => {
                      glcode.glaccounts = glaccountRes?.recordset?.map((glaccount: any) => ({
                        ...glaccount
                      })) || []; // Default to empty array on error
  
                      glcodeProcessed++;
                      if (glcodeProcessed === subgroup.glcodes.length) {
                        subgroupProcessed++;
                        if (subgroupProcessed === subgroupData.length) {
                          this.addMaingroup({ maingroup, subgroup: subgroupData },'coa');
                        }
                      }
                    },
                    err => {
                      console.error('Error fetching GL Accounts:', err);
                      glcode.glaccounts = []; // Assign empty array on error
                      glcodeProcessed++;
                      if (glcodeProcessed === subgroup.glcodes.length) {
                        subgroupProcessed++;
                        if (subgroupProcessed === subgroupData.length) {
                          this.addMaingroup({ maingroup, subgroup: subgroupData },'coa');
                        }
                      }
                    }
                  );
                });
  
                if (subgroup.glcodes.length === 0) {
                  subgroupProcessed++;
                  if (subgroupProcessed === subgroupData.length) {
                    this.addMaingroup({ maingroup, subgroup: subgroupData },'coa');
                  }
                }
              },
              err => {
                console.error('Error fetching GL Codes:', err);
                subgroup.glcodes = []; // Assign empty array on error
                subgroupProcessed++;
                if (subgroupProcessed === subgroupData.length) {
                  this.addMaingroup({ maingroup, subgroup: subgroupData },'coa');
                }
              }
            );
          });
  
          if (subgroupData.length === 0) {
            this.addMaingroup({ maingroup, subgroup: [] },'coa');
          }
        },
        err => {
          console.error('Error fetching Subgroups:', err);
          this.addMaingroup({ maingroup, subgroup: [] },'coa');
        }
      );
    });
  }

  fetchTrialBalanceSummaryData(startDate: string, endDate: string){
    this.trialBalanceSummaryData = []; // Clear existing data
    var sD = this.formatDate(startDate)
    var eD = this.formatDate(endDate)
    this.maingroupsProcessed = 0; // Reset counter for each call
    
    this.maingroups.forEach(maingroup => {
      this.financeService.getSubGroup(maingroup).subscribe(
        (subgroupRes: any) => {
          let subgroupData = subgroupRes?.recordset?.map((subgrp: any) => ({
            ...subgrp,
            glcodes: [] // Placeholder for GL Codes
          })) || []; // Default to empty array on error
    
          let subgroupProcessed = 0; // Track completed subgroups
    
          subgroupData.forEach((subgroup: any) => {
            this.financeService.getGLCode(subgroup.SUBGRPCODE).subscribe(
              (glcodeRes: any) => {
                subgroup.glcodes = glcodeRes?.recordset?.map((glcode: any) => ({
                  ...glcode,
                  glaccounts: [] // Placeholder for GL Accounts
                })) || []; // Default to empty array on error
  
                let glcodeProcessed = 0; // Track completed glcodes
    
                subgroup.glcodes.forEach((glcode: any) => {
                  this.financeService.getTrialBalanceSummary(this.mCYear.toString(),sD,eD, glcode.GLCODE).subscribe(
                    (glaccountRes: any) => {
                      glcode.glaccounts = glaccountRes?.recordset?.map((glaccount: any) => ({
                        ...glaccount
                      })) || []; // Default to empty array on error
  
                      glcodeProcessed++;
                      if (glcodeProcessed === subgroup.glcodes.length) {
                        subgroupProcessed++;
                        if (subgroupProcessed === subgroupData.length) {
                          this.addMaingroup({ maingroup, subgroup: subgroupData },'tbs');
                        }
                      }
                    },
                    err => {
                      console.error('Error fetching GL Accounts:', err);
                      glcode.glaccounts = []; // Assign empty array on error
                      glcodeProcessed++;
                      if (glcodeProcessed === subgroup.glcodes.length) {
                        subgroupProcessed++;
                        if (subgroupProcessed === subgroupData.length) {
                          this.addMaingroup({ maingroup, subgroup: subgroupData },'tbs');
                        }
                      }
                    }
                  );
                });
  
                if (subgroup.glcodes.length === 0) {
                  subgroupProcessed++;
                  if (subgroupProcessed === subgroupData.length) {
                    this.addMaingroup({ maingroup, subgroup: subgroupData },'tbs');
                  }
                }
              },
              err => {
                console.error('Error fetching GL Codes:', err);
                subgroup.glcodes = []; // Assign empty array on error
                subgroupProcessed++;
                if (subgroupProcessed === subgroupData.length) {
                  this.addMaingroup({ maingroup, subgroup: subgroupData },'tbs');
                }
              }
            );
          });
  
          if (subgroupData.length === 0) {
            this.addMaingroup({ maingroup, subgroup: [] },'tbs');
          }
        },
        err => {
          console.error('Error fetching Subgroups:', err);
          this.addMaingroup({ maingroup, subgroup: [] },'tbs');
        }
      );
    });
  }
    
    // **Function to add data to chartData without sorting yet**
    addMaingroup(entry: any,param: string) {
      if(param==='coa'){
        this.chartData.push(entry);
    
        // Increment the processed count
        this.maingroupsProcessed++;
      
        // Check if all main groups are processed
        if (this.maingroupsProcessed === this.tabs.length) {
          // Now that all data is processed, sort based on maingroups order
          this.sortChartData(param);
        }
      } else if (param==='tbs'){
        this.trialBalanceSummaryData.push(entry);
    
        // Increment the processed count
        this.maingroupsProcessed++;
      
        // Check if all main groups are processed
        if (this.maingroupsProcessed === this.tabs.length) {
          // Now that all data is processed, sort based on maingroups order
          this.sortChartData(param);
        }
      }
    }
    
    // **Function to sort chartData based on the original maingroups order**
    sortChartData(param: string) {
      // Sort based on the original order in this.maingroups
      if(param==='coa'){
        this.chartData.sort((a, b) => {
          return this.maingroups.indexOf(a.maingroup) - this.maingroups.indexOf(b.maingroup);
        });
      }else if (param==='tbs'){
        this.trialBalanceSummaryData.sort((a, b) => {
          return this.maingroups.indexOf(a.maingroup) - this.maingroups.indexOf(b.maingroup);
        });
      }
    }

    getTotalRows(maingroupData: any): number {
      let totalRows = 0;
      maingroupData.subgroup.forEach((subgroup: any) => {
        subgroup.glcodes.forEach((glcode: any) => {
          totalRows += glcode.glaccounts.length; // Count the number of GL accounts for each GL code
        });
      });
      return totalRows;
    }

  printCOA() {
    console.log(this.chartData); // Check the structure of chartData for debugging

    var doc = new jsPDF("portrait", "px", "a4");
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Chart of Accounts', 175, 50);
    doc.line(175, 53, 280, 53);
    let firstPageStartY = 60; // Start Y position for first page
    let nextPagesStartY = 35; // Start Y position for subsequent pages
    let firstPage = true;      // Flag to check if it's the first page

    autoTable(doc, {
      html: '#coaTable',
      startY: firstPageStartY,
      tableWidth: 425,
      //margin: { left: 10 },
      styles: { fontSize: 10 },
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      theme: 'striped',
      didParseCell: function (data) {
        // Check if the row contains a "maingroup" title by checking colspan
        if (data.row.section === 'body' && data.cell.raw && data.cell.colSpan === 4) {
            data.cell.styles.fontStyle = 'bold'; // Make it bold
            data.cell.styles.fontSize = 12; // Slightly larger font for emphasis
            data.cell.styles.textColor = [0, 0, 0]; // Ensure text is black
            data.cell.styles.fillColor = [220, 220, 220]; // Light gray background
            data.cell.styles.halign = 'center'; // Center align
        }
    },
      didDrawPage: function () {
        let totalPages = (doc.internal as any).getNumberOfPages(); // Type assertion to 'any'
        if (!firstPage) {
          //doc.setPage(totalPages);
          //doc.setFontSize(10);
          //doc.setTextColor(100);
          //doc.text(`Continued...`, 10, nextPagesStartY - 10);
        }
        firstPage = false;
      },
      margin: { 
        top: firstPage ? firstPageStartY : nextPagesStartY,
        left: 10
       } // Dynamically adjust margin
    });

    // Add watermark (if necessary)
    doc = this.addWaterMark(doc);
    // Save the PDF
    doc.save('chart-of-accounts.pdf');
  }

  printTBS(startDate: string, endDate: string) {
    console.log(this.trialBalanceSummaryData);

    var doc = new jsPDF("landscape", "px", "a4"); // Set to landscape
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text('Trial Balance Summary', 250, 50);
    doc.line(250, 53, 375, 53);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Start Date: ${startDate} | End Date: ${endDate}`, 10, 65);

    let firstPageStartY = 70;
    let nextPagesStartY = 35;
    let firstPage = true;

    autoTable(doc, {
      html: '#tbsTable',
      startY: firstPageStartY,
      tableWidth: 'auto', // Adjusted for landscape
      styles: { fontSize: 10 },
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      theme: 'striped',
      didParseCell: function (data) {
        // Bold styling for maingroup row
        if (data.row.section === 'body' && data.cell.raw && data.cell.colSpan === 8) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 12;
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.fillColor = [220, 220, 220];
          data.cell.styles.halign = 'center';
        }

        // Right-align numerical columns (col indexes: 2 to 7)
        if (data.column.index >= 2 && data.column.index <= 7) {
          data.cell.styles.halign = 'right';
        }
      },
      didDrawPage: function () {
        let totalPages = (doc.internal as any).getNumberOfPages();
        if (!firstPage) {
          //doc.setPage(totalPages);
          //doc.setFontSize(10);
          //doc.setTextColor(100);
          //doc.text(`Continued...`, 10, nextPagesStartY - 10);
        }
        firstPage = false;
      },
      margin: { 
        top: firstPage ? firstPageStartY : nextPagesStartY,
        left: 10
      }
    });

    // Add watermark (if necessary)
    doc = this.addWaterMark(doc);

    // Save the PDF
    doc.save(`trial-balance-summary-${startDate}-${endDate}.pdf`);
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
      doc.setTextColor(0,0,0);
      doc.setFontSize(10)
      doc.text(`Page ${i} of ${totalPages}`,390,625);
    }
    return doc;
  }

  editSubgroup(subgrp: any) {
    console.log("Editing subgroup:", subgrp);
    this.sgMes = 'Edit'
    // Open an edit modal or perform an action
    var maingroupnm = ''
    switch (subgrp.MAINGRPCODE) {
      case 'A':
        maingroupnm = 'Assets'
        break;
      case 'L':
        maingroupnm = 'Liabilities'
        break;
      case 'I':
        maingroupnm = 'Income'
        break;
      case 'X':
        maingroupnm = 'Expenses'
        break;
      case 'E':
        maingroupnm = 'Equity'
        break;
      default:
        break;
    }
    this.subGroupForm = new FormGroup({ 
      maingroupcode: new FormControl(subgrp.MAINGRPCODE, []),
      maingroupname: new FormControl(maingroupnm, []),
      subgroupcode: new FormControl(subgrp.SUBGRPCODE, []),
      subgroupname: new FormControl(subgrp.SUBGRPNAME, []), 
    });
    let dialogRef = this.dialog.open(this.subGroupLookupDialog);
  }

  get s(){
    return this.subGroupForm.controls;
  }

  submitSubgroupDetails() {
    var data = this.subGroupForm.value
    if(this.sgMes === 'Edit'){
      this.financeService.updateSubGroup(data.subgroupname, data.subgroupcode).subscribe({
        next: (response) => {
          alert('Data Updated!'); // Show success message
          window.location.reload(); // Refresh the page
        },
        error: (err) => {
          console.error('Error updating data:', err);
          alert('Failed to update data'); // Show error message
        }
      });
    } else {
      this.financeService.postSubGroup(data.subgroupname, data.subgroupcode, data.maingroupcode).subscribe({
        next: (response) => {
          alert('New data inserted'); // Show success message
          window.location.reload(); // Refresh the page
        },
        error: (err) => {
          console.error('Error inserting data:', err);
          alert('Failed to insert data'); // Show error message
        }
      });
    }
  }
    
  newSubGroup() {
    this.sgMes = 'New'
    var maingroupcode = ''
    switch (this.tabs[this.selectedIndex]) {
      case 'Assets':
        maingroupcode = 'A'
        break;
      case 'Liabilities':
        maingroupcode = 'L'
        break;
      case 'Income':
        maingroupcode = 'I'
        break;
      case 'Expenses':
        maingroupcode = 'X'
        break;
      case 'Equity':
        maingroupcode = 'E'
        break;
      default:
        break;
    }
    this.subGroupForm = new FormGroup({ 
      maingroupcode: new FormControl(maingroupcode, []),
      maingroupname: new FormControl(this.tabs[this.selectedIndex], []),
      subgroupcode: new FormControl(maingroupcode, []),
      subgroupname: new FormControl('', []), 
    });
  }

  editGlCode(glcode: any) {
    this.glMes = 'Edit'
    console.log("Editing glcode:", glcode);
    this.tempSubGroupCode = glcode.SUBGRPCODE
    this.glCodeForm = new FormGroup({ 
      gl_id: new FormControl(glcode.GL_ID, []),
      glcode: new FormControl(glcode.GLCODE, []),
      glname: new FormControl(glcode.GLNAME, []),
      subgrpcode: new FormControl(glcode.SUBGRPCODE, []), 
      pl_bs: new FormControl(glcode.PL_BS, []), 
      pl_bs_code: new FormControl(glcode.PL_BS_CODE, []), 
    });
    let dialogRef = this.dialog.open(this.glCodeLookupDialog);
    // Open an edit modal or perform an action
  }

  get g(){
    return this.glCodeForm.controls;
  }

  newGlCode() {
    this.glMes = 'New'
    this.financeService.getMaxGlId().subscribe((res: any) => {
      var glid = res.recordset[0].glid
      this.glCodeForm = new FormGroup({ 
        gl_id: new FormControl(glid, []),
        glcode: new FormControl(this.tempSubGroupCode, []),
        glname: new FormControl('', []),
        subgrpcode: new FormControl(this.tempSubGroupCode, []), 
        pl_bs: new FormControl('', []), 
        pl_bs_code: new FormControl('', []), 
      });
    })
  }

  submitGlCodeDetails() {
    var data = this.glCodeForm.value
    if(this.glMes === 'Edit'){
      this.financeService.updateGlCode(data.gl_id, data.glcode, data.glname, data.subgrpcode, data.pl_bs, data.pl_bs_code).subscribe({
        next: (response) => {
          alert('Data Updated!'); // Show success message
          window.location.reload(); // Refresh the page
        },
        error: (err) => {
          console.error('Error updating data:', err);
          alert('Failed to update data'); // Show error message
        }
      });
    } else {
      this.financeService.postGlCode(data.gl_id, data.glcode, data.glname, data.subgrpcode, data.pl_bs, data.pl_bs_code).subscribe({
        next: (response) => {
          alert('New data inserted!'); // Show success message
          window.location.reload(); // Refresh the page
        },
        error: (err) => {
          console.error('Error inserting data:', err);
          alert('Failed to insert data'); // Show error message
        }
      });
    }
  }

  goToDetailForm(GLA: any,pcode: string) {
    switch (GLA) {
      case 'S':
        var myurl = `payables/supplier/detail/${pcode}`;
        console.log(myurl)
        this.router.navigateByUrl(myurl).then((e: any) => {
        });        
        break;
      case 'C':
        var myurl = `receivables/customer/detail/${pcode}`;
        console.log(myurl)
        this.router.navigateByUrl(myurl).then((e: any) => {
        });        
        break;
      case 'G':
        var myurl = `finance/general-ledger/detail/${pcode}`;
        console.log(myurl)
        this.router.navigateByUrl(myurl).then((e: any) => {
        });        
        break;
      default:
        break;
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
    return [year,month,day].join('-');
  }
}