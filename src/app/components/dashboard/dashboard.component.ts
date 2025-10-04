import { Component } from '@angular/core';
import { ReportsService } from 'src/app/services/reports/reports.service';
import { LegendPosition } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  legendPosition: LegendPosition = LegendPosition.Right;

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
  busiCount: number = 0;
  suppCount: number = 0;
  cntyCount: number = 0;
  indsCount: number = 0;
  orgnCount: number = 0;
  topBusiList: any[] = [];
  topCustList: any[] = [];
  topSuppList: any[] = [];
  topProdList: any[] = [];
  topLocaList: any[] = [];
  countrywiseYearwiseChartData: any[] = []
  monthwiseSalesdata: any[] = []
  monthlySales: any[] = []
  topFastBrands: { [key: number]: any[] } = {}; // keyed by months
  topSlowBrands: { [key: number]: any[] } = {};
  displayFastBrands: any[] = [];
  displaySlowBrands: any[] = [];

  periods = [1, 3, 6, 12];

  
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
    this.reportService.getCustomerCount().subscribe((res: any) => {
      this.custCount = res.recordset[0].CUSTCOUNT
    })    
    this.reportService.getBusinessCount(country,'C').subscribe((res: any) => {
      this.busiCount = res.recordset[0].CUSTCOUNT
    })
    this.reportService.getBusinessList(country,'C').subscribe((res: any) => {
      this.topBusiList = res.recordset
    })
    this.reportService.getCustomerList().subscribe((res: any) => {
      this.topCustList = res.recordset
    })
    this.reportService.getProductList().subscribe((res: any) => {
      this.topProdList = res.recordset
    })    
    this.reportService.getLocationList().subscribe((res: any) => {
      const raw = res.recordset;
      this.topLocaList = raw.map((r: any) => ({
        name: r.LOCATIONNAME + ' (' + r.PercentageShare + '%)',
        value: r.TotalValue_KWD
      }));
    });
    this.reportService.getBusinessCount(country,'S').subscribe((res: any) => {
      this.suppCount = res.recordset[0].CUSTCOUNT
    })
    this.reportService.getBusinessList(country,'S').subscribe((res: any) => {
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
    this.reportService.getMonthlySales().subscribe((res: any) => {
      const raw = res.recordset;
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      const formatMonth = (monthYear: string) => {
        // monthYear is "2025-09"
        const [year, month] = monthYear.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        return `${monthNames[monthIndex]} ${year.slice(-2)}`; // e.g. "Sep 25"
      };
      const b2bSeries = raw.map((r: any) => ({
        name: formatMonth(r.MonthYear),
        value: r.B2B_Revenue_KWD
      }));
      const b2cSeries = raw.map((r: any) => ({
        name: formatMonth(r.MonthYear),
        value: r.B2C_Revenue_KWD
      }));
      const totalSeries = raw.map((r: any) => ({
        name: formatMonth(r.MonthYear),
        value: r.B2B_Revenue_KWD + r.B2C_Revenue_KWD
      }));
      this.monthlySales = [
        { name: 'B2B', series: b2bSeries },
        { name: 'B2C', series: b2cSeries },
        { name: 'Total', series: totalSeries }
      ];
    });
    for (let months of this.periods) {
      // Fast brands
      this.reportService.getFastMovingBrand(months.toString()).subscribe((res: any) => {
        this.topFastBrands[months] = res.recordset;  
        //this.displayFastBrands = this.topFastBrands[1]
        if (months === 1) this.displayFastBrands = res.recordset; // default tab
      });

      // Slow brands
      this.reportService.getSlowMovingBrand(months.toString()).subscribe((res: any) => {
        this.topSlowBrands[months] = res.recordset;
        //this.displaySlowBrands = this.topSlowBrands[1]
        if (months === 1) this.displaySlowBrands = res.recordset; // default tab
      });
    }
  }


  onTabChange(event: any, type: 'fast' | 'slow') {
    const months = this.periods[event.index];
    if (type === 'fast') {
      this.displayFastBrands = this.topFastBrands[months] || [];
    } else {
      this.displaySlowBrands = this.topSlowBrands[months] || [];
    }
  }
}




