import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentVoucherDetailComponent } from './payment-voucher-detail.component';

describe('PaymentVoucherDetailComponent', () => {
  let component: PaymentVoucherDetailComponent;
  let fixture: ComponentFixture<PaymentVoucherDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaymentVoucherDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentVoucherDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
