import { Injectable } from '@angular/core';
import { Howl } from 'howler';
import { App } from '@capacitor/app';

@Injectable({
  providedIn: 'root',
})
export class SoundService {
  private sounds: { [key: string]: Howl } = {};
  private isTransitioning = false;

  constructor() {
    this.preloadSounds();
    this.setupAppLifecycleListeners();
  }

  private preloadSounds() {
    this.sounds['open'] = new Howl({
      src: ['assets/sounds/open-app.mp3'],
      volume: 0.5,
      rate: 2.3,
    });

    this.sounds['close'] = new Howl({
      src: ['assets/sounds/close-app.mp3'],
      volume: 0.5,
    });

    console.log('Sounds loaded');
  }

  private setupAppLifecycleListeners() {
    App.addListener('appStateChange', ({ isActive }) => {
      if (!this.isTransitioning) {
        this.isTransitioning = true;

        if (isActive) {
          this.playSound('open');
        } else {
          this.playSound('close');
        }

        setTimeout(() => {
          this.isTransitioning = false;
        }, 500);
      }
    });

    App.addListener('backButton', () => {
      this.playSound('close');
    });
  }

  playSound(soundName: 'open' | 'close') {
    if (this.sounds[soundName]) {
      this.sounds[soundName].play();
    }
  }
}
