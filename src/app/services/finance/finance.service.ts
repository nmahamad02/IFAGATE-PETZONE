import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  //private url = 'http://157.175.235.195:5075/api';
private url = 'https://api.ifagate-petzone.theworkpc.com/api'

  constructor(private http:HttpClient) { }

  getSubGroup(maingrp: string) {
    return this.http.get(this.url + '/coa/subgroup/search/' + maingrp)
  }  

  postSubGroup(subgrpname: string, subgrpcode: string, maingrpcode: string) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const newTran = {
      subgrpname: subgrpname,
      subgrpcode: subgrpcode, 
      maingrpcode: maingrpcode
    }
    return this.http.post(this.url + '/coa/subgroup/new', JSON.stringify(newTran), { headers: headers })
  }

  updateSubGroup(subgrpname: string, subgrpcode: string) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const newTran = {
      subgrpname: subgrpname,
      subgrpcode: subgrpcode, 
    }
    return this.http.post(this.url + '/coa/subgroup/update', JSON.stringify(newTran), { headers: headers })
  }

  getGLCode(subgroup: string) {
    return this.http.get(this.url + '/coa/glcode/search/' + subgroup)
  }  

  getMaxGlId() {
    return this.http.get(this.url + '/coa/glcode/getMaxglcode')
  }  

  postGlCode(gl_id: string, glcode: string, glname: string, subgrpcode: string,pl_bs: string,pl_bs_code: string,) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const newTran = {
      gl_id: gl_id,
      glcode: glcode, 
      glname: glname,
      subgrpcode: subgrpcode,
      pl_bs: pl_bs,
      pl_bs_code: pl_bs_code
      
    }
    return this.http.post(this.url + '/coa/glcode/new', JSON.stringify(newTran), { headers: headers })
  }

  updateGlCode(gl_id: string, glcode: string, glname: string, subgrpcode: string,pl_bs: string,pl_bs_code: string,) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const newTran = {
      gl_id: gl_id,
      glcode: glcode, 
      glname: glname,
      subgrpcode: subgrpcode,
      pl_bs: pl_bs,
      pl_bs_code: pl_bs_code
      
    }
    return this.http.post(this.url + '/coa/glcode/update', JSON.stringify(newTran), { headers: headers })
  }

  getGLAccount(fyear: string, glcode: string) {
    return this.http.get(this.url + '/coa/opbal/search/' + fyear + '/' + glcode)
  }

  searchGLAHeader(fyear: string, modulecode: string) {
    return this.http.get(this.url + '/coa/opbalSearchHeader/' + fyear + '/' + modulecode)
  }

  searchGLADetail(fyear: string, modulecode: string, search: string) {
    return this.http.get(this.url + '/coa/opbalSearchDetail/' + fyear + '/' + modulecode + '/' + search)
  }

  getTrialBalanceSummary(fyear: string, startDate: string, endDate: string, glcode: string) {
    return this.http.get(this.url + '/coa/getTrailBalanceSummary/' + startDate + '/' + endDate + '/' + glcode + '/' +fyear)
  }

  getCurrencyList() {
    return this.http.get(this.url + '/coa/currency')
  }

  getDoc(year: string, doc: string){
    return this.http.get(this.url + '/doc/' + year + '/' + doc)
  }

  updateDoc(value: string, doc: string, year: string) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const newTran = {
      value: value,
      doc: doc, 
      year: year
    }
    return this.http.post(this.url + '/doc/update', JSON.stringify(newTran), { headers: headers })
  }

  searchTranHead(year: string, search: string, type: string){
    return this.http.get(this.url + '/finance/tranhead/search/' + year + '/' + search + '/' + type)
  }

  getTranHeadList(dbcd: string){
    return this.http.get(this.url + '/finance/tranhead/list/' + dbcd)
  }

  getTranHead(trnno: string){
    return this.http.get(this.url + '/finance/tranhead/get/' + trnno)
  }

  postTranHead(stryear: string, strcompcode: string, dbcd: string, custcode: string, name: string, trnType: string, trnno: string,trndate: string,remarks: string,total: string,discrate: string,discount: string,charges: string,amount: string,currency: string,currate: string,batchserial: string) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const newTran = {
      stryear: stryear,
      compcode: strcompcode, 
      dbcd: dbcd,
      custcode: custcode,
      name: name,
      trnType: trnType,
      trnno: trnno,
      trndate: trndate,
      remarks: remarks,
      discrate: discrate,
      discount: discount,
      charges: charges,
      amount: amount,
      currency: currency,
      currate: currate,
      batchserial: batchserial
    }
    return this.http.post(this.url + '/finance/tranhead/new', JSON.stringify(newTran), { headers: headers })
  }

  updateTranHead(stryear: string, strcompcode: string, dbcd: string, custcode: string, name: string, trnType: string, trnno: string,trndate: string,remarks: string,total: string,discrate: string,discount: string,charges: string,amount: string,currency: string,currate: string,batchserial: string) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const newTran = {
      stryear: stryear,
      compcode: strcompcode, 
      dbcd: dbcd,
      custcode: custcode,
      name: name,
      trnType: trnType,
      trnno: trnno,
      trndate: trndate,
      remarks: remarks,
      discrate: discrate,
      discount: discount,
      charges: charges,
      amount: amount,
      currency: currency,
      currate: currate,
      batchserial: batchserial
    }
    return this.http.post(this.url + '/finance/tranhead/update', JSON.stringify(newTran), { headers: headers })
  }

  getTranDetails(trnno: string){
    return this.http.get(this.url + '/finance/trandetail/get/' + trnno)
  }

  deleteTranDetail(trnno: string) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const newTran = {
      trnno: trnno
    }
    return this.http.post(this.url + '/finance/trandetails/delete', JSON.stringify(newTran), { headers: headers })
  }

  getSGLDataTemp(trnno: string){
    return this.http.get(this.url + '/finance/sgldatatemp/get/' + trnno)
  }

  postSGLDataTemp(stryear: string, trnType: string, dbcd: string, vouchno: string,vouchdate: string,type: string,accode: string,glcrbal: string,amount: string,gldbbal: string,glcrbalfc: string,gldbbalfc: string,compcode: string,remarks: string) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const newTran = {
      stryear: stryear,
      trnType: trnType, 
      dbcd: dbcd,
      vouchno: vouchno,
      vouchdate: vouchdate,
      type: type,
      accode: accode,
      glcrbal: glcrbal,
      amount: amount,
      gldbbal: gldbbal,
      glcrbalfc: glcrbalfc,
      gldbbalfc: gldbbalfc,
      compcode: compcode,
      remarks: remarks
    }
    return this.http.post(this.url + '/finance/sgldatatemp/new', JSON.stringify(newTran), { headers: headers })
  }

  updateSGLDataTemp(stryear: string, trnType: string, dbcd: string, vouchno: string,vouchdate: string,type: string,accode: string,glcrbal: string,amount: string,gldbbal: string,glcrbalfc: string,gldbbalfc: string,compcode: string,remarks: string) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const newTran = {
      stryear: stryear,
      trnType: trnType, 
      dbcd: dbcd,
      vouchno: vouchno,
      vouchdate: vouchdate,
      type: type,
      accode: accode,
      glcrbal: glcrbal,
      amount: amount,
      gldbbal: gldbbal,
      glcrbalfc: glcrbalfc,
      gldbbalfc: gldbbalfc,
      compcode: compcode,
      remarks: remarks
    }
    return this.http.post(this.url + '/finance/sgldatatemp/update', JSON.stringify(newTran), { headers: headers })
  }

  deleteSGLDataTemp(vouchno: string) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const newTran = {
      vouchno: vouchno
    }
    return this.http.post(this.url + '/finance/sgldatatemp/delete', JSON.stringify(newTran), { headers: headers })
  }

  getOutstanding(trnno: string){
    return this.http.get(this.url + '/finance/outstanding/get/' + trnno)
  }

  getInvoiceListByPcode(pcode: string){
    return this.http.get(this.url + '/finance/invoice/listByPcode/' + pcode)
  }

  getUnallocatedInvoice(custcode:string) {
    return this.http.get(this.url + '/finance/getUnallocatedInvoice/'+ custcode)
  }  

  getPartiallyAllocatedInvoice(custcode: string, recno:string) {
    return this.http.get(this.url + '/finance/getPartiallyAllocatedInvoice/'+ custcode + '/' + recno)
  }  

  getReceiptBalance(recno:string) {
    return this.http.get(this.url + '/finance/getReceiptBalance/' + recno)
  }  


  postOutstanding(stryear: string, strcompcode: string, dbcd: string, invno: string,vouchdate: string,invamount: string,custcode: string,amount: string,desc: string,lpono: string) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const newTran = {
      stryear: stryear,
      strcompcode: strcompcode, 
      dbcd: dbcd,
      invno: invno,
      vouchdate: vouchdate,
      invamount: invamount,
      amount: amount,
      custcode: custcode,
      lpono: lpono,
      desc: desc
    }
    return this.http.post(this.url + '/finance/outstanding/new', JSON.stringify(newTran), { headers: headers })
  }

  updateOutstanding(stryear: string, strcompcode: string, dbcd: string, invno: string,vouchdate: string,invamount: string,custcode: string,amount: string,desc: string,lpono: string) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const newTran = {
      stryear: stryear,
      strcompcode: strcompcode, 
      dbcd: dbcd,
      invno: invno,
      vouchdate: vouchdate,
      invamount: invamount,
      amount: amount,
      custcode: custcode,
      lpono: lpono,
      desc: desc
    }
    return this.http.post(this.url + '/finance/outstanding/update', JSON.stringify(newTran), { headers: headers })
  }

}