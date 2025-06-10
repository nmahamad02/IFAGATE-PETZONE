import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  //private url = 'http://157.175.235.195:5075/api';
private url = 'https://api.ifagate-petzone.duckdns.org/api'

  constructor(private http:HttpClient) { }

  getCustomerCount(country: string,type: string) {
    return this.http.get(this.url + '/report/get-customer-count/' + country + '/' + type)
  }  

  getCustomerList(country: string,type: string) {
    return this.http.get(this.url + '/report/get-customer-list/' + country + '/' + type)
  }

  getYearwiseCountrywiseList() {
    return this.http.get(this.url + '/report/get-yearwise-countrywise-list')
  }

  getCustomerSoa(type: string,pcode: string) {
    return this.http.get(this.url + '/report/get-customer-soa/' + type + '/' + pcode)
  }

  getParentSoa(parentcode: string) {
    return this.http.get(this.url + '/report/get-parent-soa/' + parentcode)
  }

  getIndustry() {
    return this.http.get(this.url + '/report/get-industry')
  }

  getOrganisation() {
    return this.http.get(this.url + '/report/get-organisation')
  }

  getParent() {
    return this.http.get(this.url + '/report/get-parent')
  }

  getCategory() {
    return this.http.get(this.url + '/report/get-category')
  }

  getSubcategory() {
    return this.http.get(this.url + '/report/get-subcategory')
  }

  getCountry() {
    return this.http.get(this.url + '/report/get-country')
  }
}