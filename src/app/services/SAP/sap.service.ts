import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SapService {


  private url = 'https://api.ifagate-petzone.theworkpc.com/api'

  constructor(private http:HttpClient) { }

  syncInvoiceDetails() {
    return this.http.get(this.url + '/sync-invoice-details')
  } 
  
  syncPayablesDetails() {
    return this.http.get(this.url + '/sync-payable-details')
  } 

  syncPaymentsDetails() {
    return this.http.get(this.url + '/sync-payment-details')
  } 

  syncCustomerDetails() {
    return this.http.get(this.url + '/sync-customer-details')
  } 

  syncOPBALDetails() {
    return this.http.get(this.url + '/sync-opbal-details')
  } 
}
