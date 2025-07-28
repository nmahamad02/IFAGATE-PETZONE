import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  currentImageIndex = 0;  // Start with the first image
  images = [
    { src: "../../../../assets/pics/image-1.jpeg" },
    { src: "../../../../assets/pics/image-2.jpeg" },
    { src: "../../../../assets/pics/image-3.jpeg" },
    { src: "../../../../assets/pics/image-4.jpeg" },
    { src: "../../../../assets/pics/image-5.jpeg" },
  ];

  intervalId: any;

  notmatched: boolean = false;

  loading = false;
  submitted = false;
  error = '';
  usrPwd: string = "";

  utc = new Date();
  mCurDate = this.formatDate(this.utc);
  mCurTime = this.formatTime(this.utc);
  mCYear = new Date().getFullYear();

  signinForm: FormGroup;

  constructor(public router: Router,private authenticationService: AuthenticationService){//, private crmservice: CrmService) { 
    this.signinForm = new FormGroup({
      username: new FormControl('', [ Validators.required ]),
      password: new FormControl('', [ Validators.required ])
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

  onSignin() {
    const data = this.signinForm.value;
    console.log(data);
    this.submitted = true;
    // stop here if form is invalid
    if (this.signinForm.invalid) {
      return;
    } 
    else {
      this.loading = true;
      this.encrypt(data.password);
      this.authenticationService.checkUser(data.username).subscribe ((res: any) => {
        console.log(res.recordset[0]);
        this.authenticationService.signin(res.recordset[0].USERCODE, res.recordset[0].FIRSTNAME, res.recordset[0].LASTNAME, res.recordset[0].USERID, res.recordset[0].SPECIAL_ADMIN_RIGHTS).subscribe((res: any) => {
          this.router.navigate(['home/dashboard']).then(() => {
            // Then reload after navigation completes
            window.location.reload();
          });
        })
        if(data.password === res.recordset[0].PASSWORD) {
          this.error = "";
          console.log(data.password)
          this.router.navigate(['home/dashboard']).then(() => {
            // Then reload after navigation completes
            window.location.reload();
          });
          // if signin success then:
          /*this.crmservice.getMemberFromCPR(res.recordset[0].USERCODE).subscribe((resp: any) => {
            this.authenticationService.signin(res.recordset[0].USERCODE, res.recordset[0].FIRSTNAME, res.recordset[0].LASTNAME, res.recordset[0].USERCLASS).subscribe((res: any) => {
              this.router.navigate(['home/dashboard']);
            })
          }, (err: any) => {
            this.authenticationService.signin(res.recordset[0].USERCODE, res.recordset[0].FIRSTNAME, res.recordset[0].LASTNAME, res.recordset[0].USERCLASS).subscribe((resP: any) => {
              this.router.navigate(['home/dashboard']);
            })
          })*/
        }
        else {
          this.error = "Password is incorrect!";
        }
      },
      (err: any) => {
        this.error = "Username or Password is incorrect!";
      });
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

  get f() { return this.signinForm.controls; }  

  nextImage(): void {
    // Increment the index, reset to 0 if at the end of the array
    this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
  }

  prevImage(): void {
    // Decrement the index, go to the last image if at the start
    this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
  }

  decrypt(encryptedPwd: string) {
    let decrypted = '';
    for (let i = 0; i < encryptedPwd.length; i++) {
      decrypted += String.fromCharCode(encryptedPwd.charCodeAt(i) - 10);
    }
    return decrypted;
  }

}
