import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class ItemService {

  baseURL : any = 'http://xxx.yyy.zzz.kkk:1234/data';

  constructor(public http: HttpClient) { }

  createItem(title, description){

    let randomId = Math.random().toString(36).substr(2, 5);
  }

  detailData : any;

  async getDetail() {
    // let params = new HttpParams().set('prayerId', prayerId);
    return new Promise(resolve => {
      // this.http.get(this.baseURL+'getdetail', { params: params}).subscribe(data => {
      this.http.get(this.baseURL+'/valvelist').subscribe(data => {
        this.detailData = data;
        resolve(this.detailData);
    },
      error => {
        resolve(error);
      });
    });
  }

  loginData : any;

  loginCheck(username:any, password:any)
  {
    // let opt: RequestOptions;
    // let myHeaders: Headers = new Headers;
    
    // myHeaders.set('Accept','text/html; charset-utf-8');
    // myHeaders.append('Content-type', 'application/json; charset-utf-8');

    let postData = {
      "email": username,
      "password": password
      }
  
    console.log("In service method");

    return new Promise(resolve => {
      this.http.post(this.baseURL+'/login',postData).subscribe(data => {
        this.loginData = data;
        resolve(this.loginData);
    },
      error => {
        resolve(error);
      });
    });
  }

  logActivityData: any;

  logActivity(nodeName, valveName, valvePercentage)
  {

    let postData = {
      "node_name": nodeName,
      "valve_name": valveName,
      "valve_percent": valvePercentage,
      "valve_status": valvePercentage ? 'OPEN' : 'CLOSE' 
      }
  
    console.log("In service method");
    console.log(postData);

    return new Promise(resolve => {
      this.http.post(this.baseURL+'/valvedata',postData).subscribe(data => {
        this.logActivityData = data;
        resolve(this.logActivityData);
    },
      error => {
        resolve(error);
      });
    });
  }
}
