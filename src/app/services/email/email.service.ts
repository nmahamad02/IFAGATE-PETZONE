import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
//private url = 'http://157.175.235.195:5075/api';
private url = 'https://api.ifagate-petzone.duckdns.org/api'

  constructor() { }
}
