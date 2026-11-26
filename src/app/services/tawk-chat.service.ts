import { Injectable } from '@angular/core';

declare global {
  interface Window {
    Tawk_API: any;
    Tawk_LoadStart: Date;
  }
}

@Injectable({
  providedIn: 'root'
})
export class TawkChatService {

  private isLoaded = false;
  private shouldShow = false;

  showForAdmin(): void {
    this.shouldShow = true;

    window.Tawk_API = window.Tawk_API || {};

    if (this.isLoaded) {
      window.Tawk_API.showWidget();
      return;
    }

    window.Tawk_API.onLoad = () => {
      this.isLoaded = true;

      if (this.shouldShow) {
        window.Tawk_API.showWidget();
      } else {
        window.Tawk_API.hideWidget();
      }
    };

    if (document.getElementById('tawk-widget-script')) {
      return;
    }

    window.Tawk_LoadStart = new Date();

    const script = document.createElement('script');
    script.id = 'tawk-widget-script';
    script.async = true;
    script.src = 'https://embed.tawk.to/674b425e4304e3196aeae01f/1iduvmgsi';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');

    document.body.appendChild(script);
  }

  hideForNonAdmin(): void {
    this.shouldShow = false;

    if (this.isLoaded && window.Tawk_API) {
      window.Tawk_API.hideWidget();
    }
  }
}