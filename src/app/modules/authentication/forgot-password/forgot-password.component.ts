import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  currentImageIndex = 0;  // Start with the first image
  images = [
    { src: "../../../../assets/pics/image-6.jpeg" },
    { src: "../../../../assets/pics/image-7.jpeg" },
    { src: "../../../../assets/pics/image-8.jpeg" },
    { src: "../../../../assets/pics/image-9.jpeg" },
    { src: "../../../../assets/pics/image-10.jpeg" },
  ];

  intervalId: any;

  loading = false;
  submitted = false;
  error = '';
  usrPwd: string = "";

  notmatched: boolean = false;
  recoverPasswordForm: FormGroup;

  utc = new Date();
  mCurDate = this.formatDate(this.utc);
  mCurTime = this.formatTime(this.utc);
  mCYear = new Date().getFullYear();

  constructor(public router: Router, private authenticationService: AuthenticationService){ //, private crmservice: CrmService) { 
    this.recoverPasswordForm = new FormGroup({
      username: new FormControl('', [ Validators.required ]),
      password: new FormControl('', [ Validators.required ]),
      confirmPassword: new FormControl('', [ Validators.required ]),
    });
  }

  ngOnInit(): void {
    // Set an interval to auto-slide images every 5 seconds
    this.intervalId = setInterval(() => {
      this.nextImage();
    }, 3000);
  }

  ngOnDestroy(): void {
    // Cleanup the interval when component is destroyed
    clearInterval(this.intervalId);
  }

  checkPassword() {
    const data = this.recoverPasswordForm.value;
    if(data.password === data.confirmPassword ) {
      this.error = "";
    } else {
      this.error = "Passwords do not match";
    }
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

  formatTime(date: any) {
    var d = new Date(date), hour = '' + d.getHours(), minute = '' + d.getMinutes(), second = '' + d.getSeconds();

    if (hour.length < 2) {
      hour = '0' + hour;
    } 
    if (minute.length < 2) {
      minute = '0' + minute;
    }
    if (second.length < 2) {
      second = '0' + second;
    }
    return [hour, minute, second].join(':');
  }

  onChangePassword(){
    const data = this.recoverPasswordForm.value;
    //this.encrypt(data.password);
    /*this.authenticationService.recoverPassword(data.username, data.password).subscribe((res: any) => {
      this.crmservice.getMemberFromCPR(data.username).subscribe ((resp: any) => {
        console.log(resp.recordset[0]);
        //Email submit
        this.authenticationService.sendUserForgotPasswordEmail(resp.recordset[0].MemberNo, resp.recordset[0].NAME, resp.recordset[0].Email, this.mCurDate, this.mCurTime).subscribe((respo: any) => {
          console.log('EMAIL SENT')
          alert('Password successfully changed!')
          this.router.navigate(['authentication/signin']);
        }, (err: any) => {
        console.log(err)
        })
      })
    });*/
  }

  get h() { return this.recoverPasswordForm.controls; }


  nextImage(): void {
    // Increment the index, reset to 0 if at the end of the array
    this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
  }

  prevImage(): void {
    // Decrement the index, go to the last image if at the start
    this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
  }
}
