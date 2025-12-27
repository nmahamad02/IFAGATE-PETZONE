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
    return this.http.get(this.url + '/report/get-parent-soa', {
      params: { parentcode }
    })
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

  getSalesPerson() {
    return this.http.get(this.url + '/report/get-salesperson')
  }

  getParent(country: string) {
    return this.http.get(this.url + '/report/get-parent/' + country)
  }

  getParentFromOrg(org: string,country: string) {
    return this.http.get(this.url + '/report/get-parent-from-organisation/' + org + '/' + country)
  }

  getParentFromSlp(slp: string) {
    return this.http.get(this.url + '/report/get-parent-from-salesperson/' + slp)
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

  getCustomerwisePeriodSalesByLocation( startDate: string, endDate: string, location: string) {
    return this.http.get(this.url + '/report/get-customerwise-period-sales/' + startDate + '/' + endDate + '/' + location);
  }

  getFastMovingBrand(period: string) {
    return this.http.get(this.url + '/report/get-fast-moving-brand/'  + period)
  }  
  
  getSlowMovingBrand(period: string) {
    return this.http.get(this.url + '/report/get-slow-moving-brand/'  + period)
  }  

    getCATOVR() {
    return this.http.get(this.url + '/report/get-CATOVR');
  }

  clearCATOVR() {
    return this.http.get(this.url + '/report/clear-CATOVR');
  }

  postCATOVR(row: any) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const newRow = {
      ORGNISATION: row.ORGNISATION,
      ParentCode: row.ParentCode,          // only if exists
      PARENTNAMEID: row.PARENTNAMEID,      // only if exists
      BALANCE: row.BALANCE,
      OVERDUE: row.OVERDUE,
      COLLECTED: row.COLLECTED,
      CURRENT: row.CURRENT,
      Thirty_DAYS: row.Thirty_DAYS,
      Sixty_DAYS: row.Sixty_DAYS,
      Ninety_DAYS: row.Ninety_DAYS,
      OneTwenty_DAYS: row.OneTwenty_DAYS,
      ABOVE_120_DAYS: row.ABOVE_120_DAYS,
      REMARKS: row.REMARKS
    };

  return this.http.post(
    this.url + '/report/add-CATOVR',
    JSON.stringify(newRow),
    { headers: headers }
  );
}

  getSLPANSYS() {
    return this.http.get(this.url + '/report/get-SLPANSYS');
  }

  clearSLPANSYS() {
    return this.http.get(this.url + '/report/clear-SLPANSYS');
  }

  postSLPANSYS(row: any) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const newRow = {
      Salesperson: row.SALESMAN,      // only if exists
      BALANCE: row.OUTSTANDING,
      OVERDUE: row.OVERDUE,
      COLLECTED: row.COLLECTION,
    };

  return this.http.post(
    this.url + '/report/add-SLPANSYS',
    JSON.stringify(newRow),
    { headers: headers }
  );
}

  getCATANSYS() {
    return this.http.get(this.url + '/report/get-CATANSYS');
  }

  clearCATANSYS() {
    return this.http.get(this.url + '/report/clear-CATANSYS');
  }

  postCATANSYS(row: any) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const newRow = {
      ORGNISATION: row.CATEGORY,
      BALANCE: row.OUTSTANDING,
      OVERDUE: row.OVERDUE,
      COLLECTED: row.COLLECTION,
      BUSINESS: row.BUSINESS,
    };
    console.log(newRow)

  return this.http.post(
    this.url + '/report/add-CATANSYS',
    JSON.stringify(newRow),
    { headers: headers }
  );
}



}