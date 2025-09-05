import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AccountsService {

//private url = 'http://157.175.235.195:5075/api';
private url = 'https://api.ifagate-petzone.theworkpc.com/api'

  constructor(private http:HttpClient) { }

  listOpbal(year: string, type: string) {
    return this.http.get(this.url + '/opbal/list/' + year + '/' + type)
  }    

  getOpbal(year: string, pcode: string) {
    return this.http.get(this.url + '/opbal/get/' + year + '/' + pcode)
  } 

  searchOpbal(year: string, search: string, type: string) {
    return this.http.get(this.url + '/opbal/search/' + year + '/' + search + '/' + type)
  } 

  getTitle() {
    return this.http.get(this.url + '/opbal/gettitle')
  } 

  postOpbal(pcode: string, title: string, name: string, type: string, add1: string, add2: string, add3: string, phone1: string, phone2: string, email: string,mobile: string, glcode: string,status: string, remarks: string, taxno: string, branch: string, accType: string, accCategory: string,crcpr: string,year: string,opbal:number) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
  
    const newTran = {
      pcode: pcode,
      title: title, 
      name: name,
      type: type,
      add1: add1,
      add2: add2,
      add3: add3,
      phone1: phone1,
      phone2: phone2, 
      email: email,
      mobile: mobile,
      glcode: glcode,
      status: status,
      remarks: remarks,
      taxno: taxno,
      branch: branch,
      accType: accType,
      accCategory: accCategory,
      crcpr: crcpr,
      year: year,
      opbal: opbal
    }
    return this.http.post(this.url + '/opbal/newRecord', JSON.stringify(newTran), { headers: headers })
  }

  updateOpbal(pcode: string, title: string, name: string, type: string, add1: string, add2: string, add3: string, phone1: string, phone2: string, email: string,mobile: string, glcode: string,status: string, remarks: string, taxno: string, branch: string, accType: string, accCategory: string,crcpr: string,year: string,opbal:number) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
  
    const newTran = {
      pcode: pcode,
      title: title, 
      name: name,
      type: type,
      add1: add1,
      add2: add2,
      add3: add3,
      phone1: phone1,
      phone2: phone2, 
      email: email,
      mobile: mobile,
      glcode: glcode,
      status: status,
      remarks: remarks,
      taxno: taxno,
      branch: branch,
      accType: accType,
      accCategory: accCategory,
      crcpr: crcpr,
      year: year,
      opbal: opbal
    }
    return this.http.post(this.url + '/opbal/updateRecord', JSON.stringify(newTran), { headers: headers })
  }

  getParty(pcode: string) {
    return this.http.get(this.url + '/opbal/getParty/' + pcode)
  } 

  deleteParty(partyId: string) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const newTran = {
      partyId: partyId
    }
    return this.http.post(this.url + '/opbal/deleteParty', JSON.stringify(newTran), { headers: headers })
  } 

  getPartyIdMax() {
    return this.http.get(this.url + '/opbal/getPartyIdMax')
  } 

  getBranch() {
    return this.http.get(this.url + '/opbal/getBranch')
  } 

  getCustomerAccountType() {
    return this.http.get(this.url + '/opbal/getCustomerAccountType')
  } 

  getAccountCategory() {
    return this.http.get(this.url + '/opbal/getAccountCategory')
  }

  addNewParty(pcode: string, partyid: string, name: string, type: string, add1: string, add2: string, add3: string, phone1: string, phone2: string, email: string,mobile: string) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
  
    const newTran = {
      pcode: pcode,
      partyid: partyid, 
      name: name,
      type: type,
      add1: add1,
      add2: add2,
      add3: add3,
      phone1: phone1,
      phone2: phone2, 
      email: email,
      mobile: mobile
    }
    return this.http.post(this.url + '/opbal/addNewParty', JSON.stringify(newTran), { headers: headers })
  }

  updatePartyDetails(pcode: string, partyid: string, name: string, type: string, add1: string, add2: string, add3: string, phone1: string, phone2: string, email: string,mobile: string) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
  
    const newTran = {
      pcode: pcode,
      partyid: partyid, 
      name: name,
      type: type,
      add1: add1,
      add2: add2,
      add3: add3,
      phone1: phone1,
      phone2: phone2, 
      email: email,
      mobile: mobile
    }
    return this.http.post(this.url + '/opbal/updatePartyDetails', JSON.stringify(newTran), { headers: headers })
  }

  
}