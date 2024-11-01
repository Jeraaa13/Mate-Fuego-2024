import { Component, OnInit } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.component.html',
  styleUrls: ['./splash.component.scss'],
  standalone: true,
})
export class SplashComponent {
  constructor() {}

  ionViewDidEnter() {
    SplashScreen.hide();
  }
}
