import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
//private url = 'http://157.175.235.195:5075/api';
private url = 'https://ifagate-petzone-api.theworkpc.com/api'

  constructor(private http:HttpClient) { }

  sendSyncSuccessEmail(type: string, state: string, user: string, date: string, time: string) {
    return this.http.get(this.url + '/email/sync-success/' + type + '/' + state + '/' + user + '/' + date + '/' + time)
  }     
  
  sendSyncErrorEmail(type: string, state: string, user: string, date: string, time: string) {
    return this.http.get(this.url + '/email/sync-error/' + type + '/' + state + '/' + user + '/' + date + '/' + time)
  }     
}
