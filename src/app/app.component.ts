import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ifamygate-petzone';
  loggedIn: boolean;

  constructor() {
    console.log(localStorage.getItem('username'))
    if(localStorage.getItem('username') === null || localStorage.getItem('username') === ' ' || localStorage.getItem('username') === '') {
      this.loggedIn = false;
    } else {
      this.loggedIn = true;
    }
  }

}
