import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralLedgerDetailComponent } from './general-ledger-detail.component';

describe('GeneralLedgerDetailComponent', () => {
  let component: GeneralLedgerDetailComponent;
  let fixture: ComponentFixture<GeneralLedgerDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeneralLedgerDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneralLedgerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
