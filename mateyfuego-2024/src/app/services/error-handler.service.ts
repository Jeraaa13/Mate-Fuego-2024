import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  constructor() {}

  async vibrate() {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });

      await Haptics.vibrate();

      console.log('Haptics vibró');

      // Opcionalmente, puedes usar un patrón más complejo
      /*
      const vibrateInterval = setInterval(async () => {
        await Haptics.vibrate();
      }, 200);

      setTimeout(() => {
        clearInterval(vibrateInterval);
      }, 1000);
      */
    } catch (e) {
      console.error('Error al intentar vibrar:', e);
    }
  }
}
