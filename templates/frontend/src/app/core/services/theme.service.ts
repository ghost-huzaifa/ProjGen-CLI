import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private activeTheme: string = '';

  setTheme(theme: string): void {
    const body = document.body;
    if (this.activeTheme) {
      body.classList.remove(this.activeTheme);
    }
    body.classList.add(theme);
    this.activeTheme = theme;
  }

  getActiveTheme(): string {
    return this.activeTheme;
  }
}