import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';
import { of } from 'rxjs/internal/observable/of';
import { LoggedUserModel } from 'src/app/models/logged-user';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  //private url = 'http://157.175.235.195:5075/api/user';
private url = 'https://api.ifagate-petzone.theworkpc.com/api/user'

  loggedUserSubject: BehaviorSubject<LoggedUserModel>;
  loggedUser: LoggedUserModel;

  constructor(private http: HttpClient, private router: Router) {
    //this.setUser(); // for the purpose of this example we initialize it with a default logged user
    this.loggedUserSubject = new BehaviorSubject(this.loggedUser);
  }

  isAuthenticated() {
    return this.loggedUserSubject.asObservable();
  }

  // tslint:disable-next-line:max-line-length
  setUser(userid: string, firstname: string, lastname: string, userclass: string, userright: string) {
    // this sets a default user for the template
    this.loggedUser = new LoggedUserModel();
    this.loggedUser.firstname = firstname;
    this.loggedUser.lastname = lastname;
    //this.loggedUser.image = image;
    this.loggedUser.userclass = userclass;
    localStorage.setItem('userid', JSON.stringify(userid));
    localStorage.setItem('username', JSON.stringify(userid));
    localStorage.setItem('firstname', JSON.stringify(firstname));
    localStorage.setItem('lastname', JSON.stringify(lastname));
    localStorage.setItem('userclass', JSON.stringify(userclass));
    localStorage.setItem('userright', JSON.stringify(userright));
  }

  checkUser(username: string): Observable<any> {
    // your log in logic should go here
    return this.http.get(this.url + '/' + username)
  }

  getUserRole(userclass: string) {
    return this.http.get(this.url + 's/roles/modules/' + userclass)
  }

  getUserSubmodules(userclass: string, module: string) {
    return this.http.get(this.url + 's/roles/submodules/' + userclass + '/' + module)
  }

  signin(usercode: string, firstname: string, lastname: string, userclass: string, userRight: string): Observable<any> {
    this.setUser(usercode,firstname, lastname, userclass, userRight);
    // your log in logic should go here
    this.loggedUserSubject.next(this.loggedUser);
    return of(true);
  }

  signup(fName: string, lName: string, usrCode: string, pwd: string, cntctNbr: string, userid: number) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const newUsr = {
      usercode: usrCode,
      password: pwd,
      firstname: fName,
      lastname: lName,
      contactno: cntctNbr,
      userid: userid
    }

    return this.http.post(this.url + 's/new', JSON.stringify(newUsr), { headers: headers })
  }

  logout() {
    // Remove items from localStorage
    localStorage.removeItem('userid');
    localStorage.removeItem('username');
    localStorage.removeItem('firstname');
    localStorage.removeItem('lastname');
    localStorage.removeItem('userclass');
    localStorage.removeItem('userright');
    localStorage.removeItem('moduleList');
  
    // Small delay to allow processing
    setTimeout(() => {
      if (
        !localStorage.getItem('userid') &&
        !localStorage.getItem('username') &&
        !localStorage.getItem('firstname') &&
        !localStorage.getItem('lastname') &&
        !localStorage.getItem('userclass') &&
        !localStorage.getItem('userright') &&        
        !localStorage.getItem('moduleList')
      ) {
        // First navigate to the login page
        this.router.navigate(['authentication/login']).then(() => {
          // Then reload after navigation completes
          window.location.reload();
        });
      } else {
        console.error('Logout failed: Some data was not cleared.');
      }
    }, 50); // Brief delay to ensure localStorage is updated
  }
  
}