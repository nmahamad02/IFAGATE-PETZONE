import { Component } from '@angular/core';
import { ReportsService } from 'src/app/services/reports/reports.service';


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
  monthwiseSalesdata: any[] = []
  
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

  barData = [
    { "name": "Apples", "value": 30 },
    { "name": "Oranges", "value": 50 },
    { "name": "Bananas", "value": 20 }
  ]; 

  lineData = [
    {
      name: "Sales",
      series: [
        { name: "Jan", value: 50 },
        { name: "Feb", value: 80 },
        { name: "Mar", value: 45 }
      ]
    }
  ];

  pieData = [
    { name: "Download Sales", value: 40 },
    { name: "In-Store Sales", value: 25 },
    { name: "Mail Sales", value: 35 }
  ];
  
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
      this.custCount = res.recordset[0].CUSTCOUNT
    })
    this.reportService.getCustomerList(country,'C').subscribe((res: any) => {
      this.topCustList = res.recordset
    })
    this.reportService.getCustomerCount(country,'S').subscribe((res: any) => {
      this.suppCount = res.recordset[0].CUSTCOUNT
    })
    this.reportService.getCustomerList(country,'S').subscribe((res: any) => {
      this.topSuppList = res.recordset
    })
    this.reportService.getIndustry().subscribe((res: any) => {
      this.indsCount = res.recordset.length
    })
    this.reportService.getOrganisation().subscribe((res: any) => {
      this.orgnCount = res.recordset.length
    })
    this.reportService.getCountry().subscribe((res: any) => {
      this.cntyCount = res.recordset.length
    })
    this.reportService.getYearwiseCountrywiseList().subscribe((res: any) => {
      console.log(res)
      this.countrywiseYearwiseChartData = res.recordset
    })
    this.reportService.getMonthwiseSalesdata(country).subscribe((res: any) => {
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      this.monthwiseSalesdata = [
        {
          name: 'Sales',
          series: res.recordset.map((entry: any) => {
            const [year, month] = entry.Month.split('-'); // '2025-03' → ['2025', '03']
            const monthIndex = parseInt(month, 10) - 1;
            return {
              name: `${monthNames[monthIndex]} ${year}`, // Optional: show 'Mar 2025'
              value: entry.Total_Invoiced
            };
          })
        }
      ];
    })
  }
  
}




