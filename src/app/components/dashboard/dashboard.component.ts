import { Component } from '@angular/core';
import { ReportsService } from 'src/app/services/reports/reports.service';

interface RawRecord {
  YEAR: number;
  COUNTRY: string;
  TOTAL_AMOUNT: number;
}

interface ChartSeries {
  name: string;
  value: number;
}

interface ChartGroup {
  name: string;
  series: ChartSeries[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  countries = [
    { name: 'All Countries', code: 'un' },
    { name: 'Bahrain', code: 'bh' },
    { name: 'Kuwait', code: 'kw' },
    { name: 'Saudi Arabia', code: 'sa' },
    { name: 'United Arab Emirates', code: 'ae' },
    { name: 'Oman', code: 'om' },
    { name: 'Qatar', code: 'qa' },
  ];
  
  selectedCountry = 'All Countries';
  selectedCountryCode = 'un';

  custCount: number = 0;
  suppCount: number = 0;
  cntyCount: number = 0;
  indsCount: number = 0;
  orgnCount: number = 0;
  topCustList: any[] = [];
  topSuppList: any[] = [];
  countrywiseYearwiseChartData: any[] = []
  
  updateFlag(countryName: string) {
    const selected = this.countries.find(c => c.name === countryName);
    this.selectedCountryCode = selected?.code ?? 'kw';
    if(countryName === 'All Countries') {
      this.getARData('*');
    } else {
      this.getARData(countryName)
    }
  }

  countryMap: { [key: string]: { code: string, currency: string } } = {
    'Bahrain': { code: 'bh', currency: 'BHD' },
    'Saudi Arabia': { code: 'sa', currency: 'SAR' },
    'United Arab Emirates': { code: 'ae', currency: 'AED' },
    'Qatar': { code: 'qa', currency: 'QAR' },
    'Kuwait': { code: 'kw', currency: 'KWD' },
    'Oman': { code: 'om', currency: 'OMR' },
    // More if needed
  };

  currencyToCountryCode: { [key: string]: string } = {
    'KWD': 'kw',
    'USD': 'us',
    'EUR': 'eu',
    'GBP': 'gb',
    'CAD': 'ca',
    'AED': 'ae',
    'SAR': 'sa',
    'BHD': 'bh',
    'JOD': 'jo',
    'QAR': 'qa',
    'OMR': 'om',
  };
  
  getCountryCode(name: string, currency: string): string {
    const countryCode = this.countryMap[name]?.code;
    if (countryCode) return countryCode;
    return this.currencyToCountryCode[currency] || 'xx';
  }

  getCurrency(name: string): string {
    return this.countryMap[name]?.currency || 'KWD';
  }
  
  constructor(private reportService : ReportsService) {
    this.getARData('*');
  }

  getARData(country: string){
    this.reportService.getCustomerCount(country,'C').subscribe((res: any) => {
      console.log(res)
      this.custCount = res.recordset[0].CUSTCOUNT
    })
    this.reportService.getCustomerList(country,'C').subscribe((res: any) => {
      console.log(res)
      this.topCustList = res.recordset
    })
    this.reportService.getCustomerCount(country,'S').subscribe((res: any) => {
      console.log(res)
      this.suppCount = res.recordset[0].CUSTCOUNT
    })
    this.reportService.getCustomerList(country,'S').subscribe((res: any) => {
      console.log(res)
      this.topSuppList = res.recordset
    })
    this.reportService.getIndustry().subscribe((res: any) => {
      console.log(res)
      this.indsCount = res.recordset.length
    })
    this.reportService.getOrganisation().subscribe((res: any) => {
      console.log(res)
      this.orgnCount = res.recordset.length
    })
    this.reportService.getCountry().subscribe((res: any) => {
      console.log(res)
      this.cntyCount = res.recordset.length
    })
    this.reportService.getYearwiseCountrywiseList().subscribe((res: any) => {
      console.log(res)
      this.countrywiseYearwiseChartData = this.transformToChartData(res.recordset)
    })
  }
  
  transformToChartData(data: RawRecord[]): ChartGroup[] {
    const yearToShow = 2023; // or 2024, or whichever you like
    const filtered = data.filter(item => item.YEAR === yearToShow);
  
    const series = filtered.map(item => ({
      name: item.COUNTRY,
      value: item.TOTAL_AMOUNT
    }));
  
    return [{
      name: yearToShow.toString(),
      series
    }];
  } 
}




