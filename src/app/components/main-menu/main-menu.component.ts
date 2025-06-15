import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterModule } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Component({
  selector: 'app-main-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatExpansionModule
  ],
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss'],
})
export class MainMenuComponent {
  moduleList: any[] = []
  userClass = localStorage.getItem('userclass')!

  constructor(private authenticationService : AuthenticationService) {
    this.getRoles();
    console.log(this.moduleList)
  }

  getRoles() {
    console.log(this.userClass)
    this.authenticationService.getUserRole(this.userClass).subscribe((res: any) => {
      console.log(res);
      for(let i=0; i<res.recordset.length; i++) {
        this.authenticationService.getUserSubmodules(this.userClass, res.recordset[i].MODULECODE).subscribe((resp: any) => {
          console.log(resp)
          var module = {
            MODULEDISPLAYNAME: res.recordset[i].MODULEDISPLAYNAME, 
            MODULEICON: res.recordset[i].MODULEICON, 
            MODULEURL: res.recordset[i].MODULEURL, 
            SUBMODULES: resp.recordset
          }
          this.moduleList.push(module)
        })
      }
    })
    console.log(this.moduleList)
    localStorage.setItem('moduleList', JSON.stringify(this.moduleList));
  }

  setModuleCode(modulecode: string){
    console.log(modulecode)
    localStorage.setItem('modulecode', JSON.stringify(modulecode));
  }
  
}
