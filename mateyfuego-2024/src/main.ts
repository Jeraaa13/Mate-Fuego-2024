import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';

import {
  provideFirebaseApp,
  initializeApp as initializeApp_alias,
} from '@angular/fire/app';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { initializeApp } from 'firebase/app';
import { environment } from './environments/environment';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { Camera } from '@ionic-native/camera/ngx';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { PushNotificationService } from './app/services/push-notifications.service';
import { provideHttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: FIREBASE_OPTIONS,
      useValue: environment.firebase,
    },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    Camera,
    IonicModule,
    PushNotificationService,
    provideHttpClient(),
  ],
});
