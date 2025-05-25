import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptVoucherDetailComponent } from './receipt-voucher-detail.component';

describe('ReceiptVoucherDetailComponent', () => {
  let component: ReceiptVoucherDetailComponent;
  let fixture: ComponentFixture<ReceiptVoucherDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReceiptVoucherDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiptVoucherDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
