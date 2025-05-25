import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptVoucherAllocationComponent } from './receipt-voucher-allocation.component';

describe('ReceiptVoucherAllocationComponent', () => {
  let component: ReceiptVoucherAllocationComponent;
  let fixture: ComponentFixture<ReceiptVoucherAllocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReceiptVoucherAllocationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiptVoucherAllocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
