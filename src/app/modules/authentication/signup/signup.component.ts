import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
//import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
//import { MatDialog } from '@angular/material/dialog';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { CrmService } from 'src/app/services/crm/crm.service';
import { UploadService } from 'src/app/services/upload/upload.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {

  showMemberDetails = true
  showPropertyDetails = false
  showPropertyDocuments = false
  showLoginDetails = false

  detailForm: FormGroup;

  pageNumber = 0;

  imageSrc: string = '';
  errorMessage: string = '';
  selectedFileToUpload = new File([""], "img");

  usrPwd: string = '';

  utc = new Date();
  mCurDate = this.formatDate(this.utc);
  mCYear = new Date().getFullYear();

  rented = false;

  constructor(private router: Router, private authenticationService: AuthenticationService,private crmService: CrmService, private uploadService: UploadService) { 
    this.detailForm = new FormGroup({ 
      cprno: new FormControl('', [Validators.required]),
      name: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
      confirmPassword: new FormControl('', [Validators.required]),
      memberType: new FormControl('O', []),
      image: new FormControl('', []),
      add1: new FormControl('', []),
      add2: new FormControl('', []),
      add3: new FormControl('', []), 
      phone1: new FormControl('', []),
      phone2: new FormControl('', []),
      mobile: new FormControl('', []),
      email: new FormControl('', [Validators.required, Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]),
      properties: new FormArray([]),
    });
  }

  ngOnInit() {
  }

  onImageChange(event: any) {
    var filesList: FileList = event.target.files;
    const reader = new FileReader();

    if(event.target.files && event.target.files.length) {
      const fileToUpload: any = filesList.item(0);
      console.log(fileToUpload.name);
      const imgNm: string = fileToUpload.name;
      console.log(imgNm);
      reader.readAsDataURL(fileToUpload);
      reader.onload = () => {
          this.imageSrc = reader.result as string;
          this.detailForm.patchValue({
            //image: reader.result
            image: imgNm
          });
      };
      console.log(this.imageSrc)
      this.selectedFileToUpload = fileToUpload;
    }
  }

  onFileChange(event: any, propIndex: number) {
    var filesList: FileList = event.target.files;
    const reader = new FileReader();

    if(event.target.files && event.target.files.length) {
      const fileToUpload: any = filesList.item(0);
      console.log(fileToUpload);
      console.log(fileToUpload.type)
      if(fileToUpload.type === 'application/pdf') {
        const fileNm: string = fileToUpload.name;
        console.log(fileNm);
        reader.readAsDataURL(fileToUpload);
        reader.onload = () => {
          const docUrl = "https://ifarealestate.s3.me-south-1.amazonaws.com/documents/" + fileNm
            const document = new FormGroup({
              pDocument: new FormControl(fileToUpload, []),
              pDocumentSrc: new FormControl(reader.result as String, []),
              pDocumentSource: new FormControl(fileNm, []),
              pDocumentType: new FormControl('', []),      
              pDocumentUrl: new FormControl(docUrl, [])
            });
            this.documents(propIndex).push(document)
        };
        this.clearExtra(propIndex)
        //this.selectedFileToUpload = fileToUpload;
      } else {
        //this.snackBar.open("Only PDF Files Supported!", "OK");
        //this.clearExtra(propIndex)
      }
    }
  }

  clearExtra(propIndex: number) {
    for(let i=0; i<this.documents(propIndex).length; i++){
      if(this.documents(propIndex).at(i).value.pDocument === ""){
        console.log('empty')
        this.deleteDocument(i,propIndex);
      } else {
        console.log(this.documents(propIndex).at(i).value.pDocument)
      }
    }
  }

  checkData(no: number){
    let data = this.detailForm.value
    console.log(data)
    console.log(this.pageNumber)
    if(this.pageNumber === 0){
      if(data.cprno === '') {
        alert('Please enter your ID Number. It is necessary to identify you and your properties.')
      } else if (data.email === '') {
        alert('Please enter your email address. It is necessary to keep you updated.')
      } else if ((data.cprno != '')&&(data.email != '')){
        this.changePage(no)
      }
    } else if(this.pageNumber === 1) {
      if(data.properties.length === 0) {
        alert('Please enter your Property.')
      } else {
        for(let i=0; i<data.properties.length;i++){
          if(data.properties[i].pHFNo === '') {
            alert('Please enter your house number.')
            break;
          } else if(data.properties[i].pParcelNo === '') {
            alert('Please enter your title deed number.')
            break;
          } else {
            this.changePage(no)
          }
        }
      }
    } else if(this.pageNumber === 2) {
      for(let i=0; i<data.properties.length;i++){
        for(let j=0; j<data.properties[i].pDocuments.length;i++){
          if(data.properties[i].pDocuments[j].pDocumentType === '') {
            alert('Please enter the type for the document you have uploaded for this property.')
            break; 
          } else {
            this.changePage(no)
          }
        }
      }
    } else if(this.pageNumber === 3) {
      this.changePage(no)
    }
  }

  changePage(no: number){
    this.pageNumber = this.pageNumber + no
    if(this.pageNumber === 0) {
      this.showMemberDetails = true
      this.showPropertyDetails = false
      this.showPropertyDocuments = false
      this.showLoginDetails = false
    } else if(this.pageNumber === 1) {
      this.showMemberDetails = false
      this.showPropertyDetails = true
      this.showPropertyDocuments = false
      this.showLoginDetails = false
    } else if(this.pageNumber === 2) {
      this.showMemberDetails = false
      this.showPropertyDetails = false
      this.showPropertyDocuments = true
      this.showLoginDetails = false
    } else if(this.pageNumber === 3) {
      this.showMemberDetails = false
      this.showPropertyDetails = false
      this.showPropertyDocuments = false
      this.showLoginDetails = true
    }
  }

  checkMember(type: string){
    if(type === 'T'){
      this.rented = true;
    } else {
      this.rented = false;
    }
  }

  addProperty() {
    const index = this.properties.length + 1;
    const property = new FormGroup({
      pHFNo: new FormControl('', [Validators.required]),
      pParcelNo: new FormControl('', [Validators.required]),
      pPlotNo: new FormControl('0', [Validators.required]),
      pPlotArea: new FormControl('0', []),
      pBuiltUpArea: new FormControl('0', []),
      pTotalArea: new FormControl('0', []), 
      pZone: new FormControl('', []),
      pVoteWeightage: new FormControl('', []),
      pEligibity: new FormControl('', []), 
      pRooms: new FormControl('0', []),
      pBathrooms: new FormControl('0', []),
      pCarParkSlots: new FormControl('0', []), 
      tAgreementNbr: new FormControl('0', []), 
      tAgreementStartDate: new FormControl('0', []), 
      tAgreementEndDate: new FormControl('0', []), 
      pDocuments: new FormArray([]),
    });
    this.properties.push(property);
  }

  deleteProperty(index: number) {
    if(this.properties.length === 1){
      console.log(this.properties)
    } else {
      this.properties.removeAt(index);
    }
  }

  addDocument(propIndex:number) {
    const document = new FormGroup({
      pDocument: new FormControl('', []),
      pDocumentSrc: new FormControl('', []),
      pDocumentSource: new FormControl('', []),
      pDocumentType: new FormControl('', []),      
      pDocumentUrl: new FormControl('', [])
    });
    this.documents(propIndex).push(document)
  }

  deleteDocument(index: number, propIndex: number) {
    this.documents(propIndex).removeAt(index)
  }

  submitForm() {
    const data = this.detailForm.value
    console.log(data)
  
    //Member details submit
    this.crmService.getMemberFromCPR(data.cprno).subscribe((res: any) => {
      console.log(res);
      if(res.recordset.length === 0) {
        //MEMBER INSERT
        this.crmService.postMember(data.cprno,data.cprno,data.cprno,data.name,'O',data.add1,data.add2,data.add3,data.phone1,data.phone2,data.email,data.cprno,'Y',data.image,'self','').subscribe((response: any) => {
          console.log(response);
          this.uploadImage();
        }, (rreror: any) => {
          console.log(rreror);
        })
      } else {
        //MEMBER UPDATE
        this.crmService.updateMember(data.cprno,data.cprno,data.cprno,data.name,'O',data.add1,data.add2,data.add3,data.phone1,data.phone2,data.email,data.cprno,'Y',data.image,'self','').subscribe((response: any) => {
          console.log(response);
          this.uploadImage();
        }, (rreror: any) => {
          console.log(rreror);
        })
      }
    }, (err: any) => {
      console.log(err)
      //MEMBER INSERT
      this.crmService.postMember(data.cprno,data.cprno,data.cprno,data.name,'O',data.add1,data.add2,data.add3,data.phone1,data.phone2,data.email,data.cprno,'Y',data.image,'self','').subscribe((response: any) => {
        console.log(response);
        this.uploadImage();
      }, (rreror: any) => {
        console.log(rreror);
      })
    })

    /*Landlord details submit
    this.crmService.getLandLordFromCPR(data.cprno).subscribe((resp: any) => {
      console.log(resp);
      if(resp.recordset.length === 0) {
        //LANDLORD INSERT
        this.crmService.postLandlord(data.cprno,data.name,data.add1,data.add2,data.add3,data.phone1,data.phone2,data.phone1,data.email,data.cprno,data.phone1,data.cprno,'1',data.name,this.mCurDate).subscribe((response: any) => {
          console.log(response);
  
        }, rreror => {
          console.log(rreror);
        })
      } else {
        //LANDLORD UPDATE
        this.crmService.updateLandLord(data.cprno,data.name,data.add1,data.add2,data.add3,data.phone1,data.phone2,data.phone1,data.email,data.cprno,data.phone1,data.cprno,'1',data.name,this.mCurDate).subscribe((response: any) => {
          console.log(response);
  
        }, rreror => {
          console.log(rreror);
        })
      }
    }, err => {
      console.log(err)
      //LANDLORD INSERT              
      this.crmService.postLandlord(data.cprno,data.name,data.add1,data.add2,data.add3,data.phone1,data.phone2,data.phone1,data.email,data.cprno,data.phone1,data.cprno,'1',data.name,this.mCurDate).subscribe((response: any) => {
        console.log(response);

      }, rreror => {
        console.log(rreror);
      })
    })*/

    //OPBAL details submit
    this.crmService.getOPBALFromPcode(data.cprno).subscribe((resp: any) => {
      console.log(resp);
      if(resp.recordset.length === 0) {
        //OPBAL INSERT
        this.crmService.addNewOpbal(data.cprno,data.name,data.add1,data.add2,data.add3,data.phone1,data.phone2,data.phone1,data.email).subscribe((response: any) => {
          console.log(response);
        }, (rreror: any) => {
          console.log(rreror);
        })
      } else {
        //OPBAL UPDATE
        this.crmService.updateOpbal(data.cprno,data.name,data.add1,data.add2,data.add3,data.phone1,data.phone2,data.phone1,data.email).subscribe((response: any) => {
          console.log(response);
        }, (rreror: any) => {
          console.log(rreror);
        })
      }
    }, (err: any) => {
      console.log(err)
      //OPBAL INSERT              
      this.crmService.addNewOpbal(data.cprno,data.name,data.add1,data.add2,data.add3,data.phone1,data.phone2,data.phone1,data.email).subscribe((response: any) => {
        console.log(response);
      }, (rreror: any) => {
        console.log(rreror);
      })
    })

    //Property details submit
    this.crmService.deleteProperties(data.cprno).subscribe((res: any) => {
      for(let i=0; i<data.properties.length; i++) {
        console.log(data.properties)
        //PROPERTY INSERT
        this.crmService.addNewProperty(data.properties[i].pHFNo,data.cprno,data.properties[i].pRooms,data.properties[i].pBathrooms,data.properties[i].pCarParkSlots,data.properties[i].pTotalArea, data.properties[i].pParcelNo, data.properties[i].pPlotNo,data.properties[i].pPlotArea,data.properties[i].pBuiltUpArea).subscribe((response: any) => {
          console.log(response);
          //PROPERTY DOCUMENTS INSERT
          for(let j=0; j<data.properties[i].pDocuments.length; j++) {
            //this.uploadService.uploadDoc(data.properties[i].pDocuments[j].pDocument)
            this.crmService.addNewDocument(data.cprno,data.properties[i].pHFNo,data.properties[i].pDocuments[j].pDocumentSource,data.properties[i].pDocuments[j].pDocumentType).subscribe((res: any) => {
              console.log(res)
            }, (err: any) => {
              console.log(err)
            })
          }
        }, (rreror: any) => {
          console.log(rreror);
        })
        //JOB INSERT
        this.crmService.addNewJob(String(this.mCYear),data.properties[i].pHFNo,this.mCurDate,data.cprno,data.name).subscribe((res: any) => {
          console.log(res)
        }, (err: any) => {
          console.log(err)
        })
      }
    })

    //User details submit
    //this.encrypt(data.password);
    this.authenticationService.checkUser(data.cprno).subscribe ((res: any) => {
      if (res.recordset.length === 0) {
        this.authenticationService.signup(data.name, " ", data.cprno, data.password, data.phone1, data.cprno).subscribe((res: any) => {
          console.log(res)
        }, (err: any) => {
          console.log(err)
        })
      } else {
        /*this.authenticationService.recoverPassword(data.cprno, data.password).subscribe((res: any) => {
          //this.router.navigate(['authentication/signin']);
        });*/
      }
    }, (err: any) => {
      this.authenticationService.signup(data.name, " ", data.cprno, data.password, data.phone1, data.cprno).subscribe((res: any) => {
        console.log(res)
      }, (err: any) => {
        console.log(err)
      })
    })

    /*Email submit
    this.authenticationService.sendNewUserEmail(data.cprno, data.name, data.password, data.email, this.mCurDate).subscribe((res: any) => {
      console.log('EMAIL SENT')
    }, (err: any) => {
      console.log(err)
    })*/

    //this.snackBar.open(`${data.name} (${data.cprno}) successfully signed up!`,'OK');
    this.router.navigateByUrl('/authentication/signin').then(e => {
    })

  }

  uploadImage() {
    if (!this.selectedFileToUpload) {
      alert('Please select a file first!'); // or any other message to the user to choose a file
      return;
    } else {
      console.log('attempt to upload')
      this.uploadService.uploadImage(this.selectedFileToUpload);
    }
  }

  searchLandlord(cprNo: string) {/*
    this.crmService.getLandLordFromCPR(cprNo).subscribe((res: any) => {
      console.log(res);
      this.crmService.getLandlordWiseProperties(cprNo).subscribe((resp: any) => {
        console.log(resp);
        this.detailForm.patchValue({ 
          cprno: res.recordset[0].CPRNO,
          name: res.recordset[0].NAME,
          memberType: 'O',
          add1: res.recordset[0].ADD1,
          add2: res.recordset[0].ADD2,
          add3: res.recordset[0].ADD3,
          phone1: res.recordset[0].PHONE1,
          phone2: res.recordset[0].PHONE2,
          mobile: res.recordset[0].MOBILE,
          email: res.recordset[0].EMAIL_ID,
        });
        if(resp.recordset.length === 0){
          this.addProperty()
        } else {
          for(let i=0; i < resp.recordset.length; i++) {
            const property = new FormGroup({
              pHFNo: new FormControl(resp.recordset[i].house_flat_no, [Validators.required]),
              pParcelNo: new FormControl(resp.recordset[i].parcelno, [Validators.required]),
              pPlotNo: new FormControl(resp.recordset[i].plotno, [Validators.required]),
              pPlotArea: new FormControl(resp.recordset[i].plotarea, []),
              pBuiltUpArea: new FormControl(resp.recordset[i].BUILTUPAREA, []),
              pTotalArea: new FormControl(resp.recordset[i].total_area, []), 
              pZone: new FormControl(resp.recordset[i].zone, []),
              pVoteWeightage: new FormControl(resp.recordset[i].voting_power_factor, []),
              pEligibity: new FormControl(resp.recordset[i].eligiblevote, []), 
              pRooms: new FormControl(resp.recordset[i].NO_OF_ROOMS, []),
              pBathrooms: new FormControl(resp.recordset[i].NO_OF_BATHROOMS, []),
              pCarParkSlots: new FormControl(resp.recordset[i].NO_OF_CARPARK_SLOTS, []), 
              pDocuments: new FormArray([]),
            });
            this.properties.push(property);
          }
        }
      }, (err: any) => {
        this.addProperty()
      })
    })*/
  }

  encrypt(pwd: string) {
    this.usrPwd = "";
    var i: number;
    var ascii: number;
    for(i = 0; i < pwd.length; i++) {
      ascii = pwd[i].charCodeAt(0)+10;
      this.usrPwd += String.fromCharCode(ascii);
    }
  }

  checkPasswords() {
    const data = this.detailForm.value
    if(data.password === data.confirmPassword) {
      this.errorMessage = ''
    } else {
      this.errorMessage = 'Passwords do not match!'
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

  get f(){
    return this.detailForm.controls;
  }

  get properties(): FormArray {
    return this.detailForm.get('properties') as FormArray
  }

  documents(propIndex: number): FormArray {
    return this.properties.at(propIndex).get("pDocuments") as FormArray
  }

}