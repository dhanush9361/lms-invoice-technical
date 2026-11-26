import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceSetup } from './invoice-setup';

describe('InvoiceSetup', () => {
  let component: InvoiceSetup;
  let fixture: ComponentFixture<InvoiceSetup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceSetup],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceSetup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
