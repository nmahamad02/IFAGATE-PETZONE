import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JournalVoucherDetailComponent } from './journal-voucher-detail.component';

describe('JournalVoucherDetailComponent', () => {
  let component: JournalVoucherDetailComponent;
  let fixture: ComponentFixture<JournalVoucherDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JournalVoucherDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JournalVoucherDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
