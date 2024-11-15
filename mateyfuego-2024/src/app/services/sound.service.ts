import { Injectable } from '@angular/core';
import { Howl } from 'howler';
import { Platform } from '@ionic/angular';
import { App } from '@capacitor/app';

@Injectable({
  providedIn: 'root',
})
export class SoundService {
  private sounds: { [key: string]: Howl } = {};
  private isTransitioning = false;

  constructor(private platform: Platform) {
    this.preloadSounds();
    this.setupAppLifecycleListeners();
  }

  private preloadSounds() {
    this.sounds['open'] = new Howl({
      src: ['assets/sounds/open-app.mp3'],
      volume: 0.5,
    });

    this.sounds['close'] = new Howl({
      src: ['assets/sounds/close-app.mp3'],
      volume: 0.5,
    });

    console.log('Sounds loaded');
  }

  private setupAppLifecycleListeners() {
    // Only use appStateChange to manage opening and closing sounds
    App.addListener('appStateChange', ({ isActive }) => {
      if (!this.isTransitioning) {
        this.isTransitioning = true;

        if (isActive) {
          this.playSound('open');
        } else {
          this.playSound('close');
        }

        // Reset the flag after sound finishes playing
        setTimeout(() => {
          this.isTransitioning = false;
        }, 500); // Adjust delay to match sound duration
      }
    });

    // Back button handler for a manual close sound if needed
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
