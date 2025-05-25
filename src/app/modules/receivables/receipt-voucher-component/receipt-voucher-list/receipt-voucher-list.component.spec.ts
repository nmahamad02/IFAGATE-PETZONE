import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptVoucherListComponent } from './receipt-voucher-list.component';

describe('ReceiptVoucherListComponent', () => {
  let component: ReceiptVoucherListComponent;
  let fixture: ComponentFixture<ReceiptVoucherListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReceiptVoucherListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiptVoucherListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
