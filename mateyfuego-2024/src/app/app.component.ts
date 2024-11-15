import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SplashScreen } from '@capacitor/splash-screen';
import { Platform } from '@ionic/angular';
import { SoundService } from './services/sound.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private platform: Platform, private soundService: SoundService) {
    this.initializeApp();
  }

  async initializeApp() {
    this.platform.ready().then(() => {
      SplashScreen.hide();
    });
  }
}
