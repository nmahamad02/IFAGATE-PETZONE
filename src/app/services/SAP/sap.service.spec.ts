import { TestBed } from '@angular/core/testing';

import { SapService } from './sap.service';

describe('SapService', () => {
  let service: SapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
