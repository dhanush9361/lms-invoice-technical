import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechnicalSupportLearner } from './technical-support-learner';

describe('TechnicalSupportLearner', () => {
  let component: TechnicalSupportLearner;
  let fixture: ComponentFixture<TechnicalSupportLearner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechnicalSupportLearner],
    }).compileComponents();

    fixture = TestBed.createComponent(TechnicalSupportLearner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
