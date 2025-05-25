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
  topCustList: any[] = [];
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
    // Add more as needed
  };
  
  getCountryCode(name: string): string {
    return this.countryMap[name]?.code || 'xx';
  }
  
  getCurrency(name: string): string {
    return this.countryMap[name]?.currency || 'USD';
  }
  
  constructor(private reportService : ReportsService) {
    this.getARData('*');
  }

  getARData(country: string){
    this.reportService.getCustomerCount(country).subscribe((res: any) => {
      console.log(res)
      this.custCount = res.recordset[0].CUSTCOUNT
    })
    this.reportService.getCustomerList(country).subscribe((res: any) => {
      console.log(res)
      this.topCustList = res.recordset
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




