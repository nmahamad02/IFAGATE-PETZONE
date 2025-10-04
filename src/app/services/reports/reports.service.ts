import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  //private url = 'http://157.175.235.195:5075/api';
private url = 'https://api.ifagate-petzone.theworkpc.com/api'

  constructor(private http:HttpClient) { }

  getBusinessCount(country: string,type: string) {
    return this.http.get(this.url + '/report/get-business-count/' + country + '/' + type)
  }    
  
  getCustomerCount() {
    return this.http.get(this.url + '/report/get-customer-count')
  }  

  getBusinessList(country: string,type: string) {
    return this.http.get(this.url + '/report/get-business-list/' + country + '/' + type)
  }

  getCustomerList() {
    return this.http.get(this.url + '/report/get-customer-list')
  }  
  
  getProductList() {
    return this.http.get(this.url + '/report/get-product-list')
  } 
  
  getLocationList() {
    return this.http.get(this.url + '/report/get-location-list')
  }

  getYearwiseCountrywiseList() {
    return this.http.get(this.url + '/report/get-yearwise-countrywise-list')
  }

  getMonthwiseSalesdata(country: string) {
    return this.http.get(this.url + '/report/get-monthwise-salesdata/' + country)
  }

  getCustomerSoa(type: string,pcode: string) {
    return this.http.get(this.url + '/report/get-customer-soa/' + type + '/' + pcode)
  }

  getParentSoa(parentcode: string) {
    return this.http.get(this.url + '/report/get-parent-soa/' + parentcode)
  }

  getCustomerOpenSoa(type: string,pcode: string) {
    return this.http.get(this.url + '/report/get-customer-open-soa/' + type + '/' + pcode)
  }

  getParentOpenSoa(parentcode: string) {
    return this.http.get(this.url + '/report/get-parent-open-soa/' + parentcode)
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

  getParentFromOrg(org: string) {
    return this.http.get(this.url + '/report/get-parent-from-organisation/' + org)
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

  getLocation() {
    return this.http.get(this.url + '/report/get-location')
  }

  searchCustomer(search: string) {
    return this.http.get(this.url + '/report/search-customer/' + search)
  }

  getMonthlySales() {
    return this.http.get(this.url + '/report/get-monthly-sales')
  }

  getMonthwiseSalesSummary() {
    return this.http.get(this.url + '/report/get-monthwise-sales-summary')
  }

  getLocationwiseMonthlySales(loc: string) {
    return this.http.get(this.url + '/report/get-locationwise-monthly-sales/' + loc)
  }

  getItemwisePeriodSales(startDate: string, endDate: string, location: string, customer: string) {
    return this.http.get(this.url + '/report/get-itemwise-period-sales/'  + startDate + '/' + endDate + '/' + location + '/' + customer)
  }  
  
  getVoucherwisePeriodSales(startDate: string, endDate: string, location: string, customer: string) {
    return this.http.get(this.url + '/report/get-voucherwise-period-sales/'  + startDate + '/' + endDate + '/' + location + '/' + customer)
  }

  getFastMovingBrand(period: string) {
    return this.http.get(this.url + '/report/get-fast-moving-brand/'  + period)
  }  
  
  getSlowMovingBrand(period: string) {
    return this.http.get(this.url + '/report/get-slow-moving-brand/'  + period)
  }  
}