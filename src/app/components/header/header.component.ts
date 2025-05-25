import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { Route, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  firstName = this.removeQuotes(localStorage.getItem('firstname')?.trim() || 'Guest');  // If null, show 'Guest'
  lastName = this.removeQuotes(localStorage.getItem('lastname')?.trim() || '');  // Handle empty last name
  imgSrc = localStorage.getItem('imgSrc') || './../../../assets/pics/a.png';  // Replace with actual default image path

  constructor(private authenticationService: AuthenticationService, private router: Router, private translate: TranslateService) {
      // Set default language
      const browserLang = this.translate.getBrowserLang() || 'en';
      const savedLang = localStorage.getItem('language') || browserLang;
      this.translate.use(savedLang);      
  }
  changeLanguage(event: Event) {
    const selectedLanguage = (event.target as HTMLSelectElement).value;
    this.translate.use(selectedLanguage);
    localStorage.setItem('language', selectedLanguage);

    // Set direction dynamically
    //document.documentElement.dir = selectedLanguage === 'ar' ? 'rtl' : 'ltr';
  }
  
  // Helper method to remove any surrounding quotes
  private removeQuotes(value: string | null): string {
    if (value) {
      return value.replace(/^"|"$/g, ''); // Removes quotes at the start and end of the string
    }
    return '';
  }

  navigateToDashboard() {
      this.router.navigate(['/dashboard']);
  }
  
  logout() {
    this.authenticationService.logout();
    this.router.navigate(['authentication/login']);
    
  }

}
