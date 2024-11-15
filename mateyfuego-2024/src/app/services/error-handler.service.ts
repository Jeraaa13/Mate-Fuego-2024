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
    } catch (e) {
      console.error('Error al intentar vibrar:', e);
    }
  }
}
