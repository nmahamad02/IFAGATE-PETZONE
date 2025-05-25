import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private url = 'http://157.175.235.195:5075/api';

  constructor(private http:HttpClient) { }

  getCustomerCount(country: string) {
    return this.http.get(this.url + '/report/get-customer-count/' + country)
  }  

  getCustomerList(country: string) {
    return this.http.get(this.url + '/report/get-customer-list/' + country)
  }

  getYearwiseCountrywiseList() {
    return this.http.get(this.url + '/report/get-yearwise-countrywise-list')
  }

  getCustomerSoa(type: string,pcode: string) {
    return this.http.get(this.url + '/report/get-customer-soa/' + type + '/' + pcode)
  }

}
