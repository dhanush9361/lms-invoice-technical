import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChild } from '@angular/core';

import { TwoFaVerification } from '../two-fa-verification/two-fa-verification';
import { InvoiceSetup } from '../invoice-setup/invoice-setup';

interface SettingsTab {
  id: string;
  label: string;
  /** false = placeholder tab ("Coming Soon"), not selectable yet */
  enabled: boolean;
}

@Component({
  selector: 'app-settings-menu',
  standalone: true,
  imports: [TwoFaVerification, InvoiceSetup],
  templateUrl: './settings-menu.html',
  styleUrl: './settings-menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class SettingsMenu {
  readonly tabs: SettingsTab[] = [
    { id: 'general', label: 'General Settings', enabled: true },
    { id: 'subscription', label: 'Subscription & Billing', enabled: true },
    { id: 'invoice', label: 'Invoice Setup', enabled: true },
  ];

  readonly activeTab = signal<string>('general');

  private readonly tabStrip = viewChild<ElementRef<HTMLElement>>('tabStrip');

  selectTab(tab: SettingsTab): void {
    if (tab.enabled) this.activeTab.set(tab.id);
  }

  /** The ">" button at the right end of the tab row. */
  scrollTabs(): void {
    this.tabStrip()?.nativeElement.scrollBy({ left: 220, behavior: 'smooth' });
  }
}