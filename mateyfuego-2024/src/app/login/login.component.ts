import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Auth, user } from '@angular/fire/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { PushNotificationService } from '../services/push-notifications.service';
import Swal from 'sweetalert2';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, IonicModule, CommonModule, RouterLink],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router,
    private route: ActivatedRoute,
    private pushService: PushNotificationService,
    private notificationService: NotificationService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['noVerified']) {
        this.errorMessage =
          'Tu cuenta aún no ha sido verificada por un administrador.';
      }
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    const { email, password } = this.loginForm.value;
    try {
      // Sign in the user with Firebase
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      console.log('User logged in: ', userCredential);

      // After login, fetch user profile from Firestore
      await this.checkUserInCollections(userCredential.user.uid);
      await this.pushService.inicializarNotificaciones(
        userCredential.user.uid,
        'dueno'
      );
    } catch (error) {
      this.errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
      console.error('Error during login: ', error);
    }
  }

  async checkUserInCollections(uid: string) {
    const db = getFirestore();
    let found = false;

    const collections = ['duenosSupervisores', 'empleados', 'clientes'];

    for (const collectionName of collections) {
      const colRef = collection(db, collectionName);
      const q = query(colRef, where('uid', '==', uid));
      const querySnapshot = await getDocs(q);

      console.log('uid => ', uid);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const tipoPerfil = userData?.['tipoPerfil'];

        if (tipoPerfil) {
          this.navigateToTipoPerfil(tipoPerfil);
        } else {
          this.errorMessage = `Tipo de perfil no encontrado en ${collectionName}.`;
        }
        found = true;
        break;
      }
    }

    if (!found) {
      this.errorMessage =
        'No se encontró información del usuario en las colecciones.';
    }
  }
  navigateToTipoPerfil(tipoPerfil: string) {
    switch (tipoPerfil) {
      case 'cliente':
        this.router.navigate(['/home-clientes']);
        break;

      case 'dueno':
        this.router.navigate(['/home-dueno-supervisores']);
        break;

      case 'supervisor':
        this.router.navigate(['/home-dueno-supervisores']);
        break;

      case 'Maitre':
        this.router.navigate(['/home-maitre']);
        break;

      default:
        this.router.navigate(['/home-empleados']);
        break;
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  async login() {
    const { email, password } = this.loginForm.value;
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      console.log('User logged in: ', userCredential);
    } catch (error) {
      console.error('Error during login: ', error);
    }
  }

  fillForm(role: string) {
    switch (role) {
      case 'dueño':
        this.loginForm.setValue({
          email: 'juanmaptorte@hotmail.com',
          password: '123456',
        });
        break;

      case 'supervisor':
        this.loginForm.setValue({
          email: 'supervisor@empresa.com',
          password: '123456',
        });
        break;

      case 'maitre':
        this.loginForm.setValue({
          email: 'juanmanuelportela2@gmail.com',
          password: '123456',
        });
        break;

      case 'mozo':
        this.loginForm.setValue({
          email: 'bager87957@edectus.com',
          password: '123123',
        });
        break;

      case 'cocinero':
        this.loginForm.setValue({
          email: 'cocinero@empresa.com',
          password: '123456',
        });
        break;

      case 'bartender':
        this.loginForm.setValue({
          email: 'bartender@empresa.com',
          password: '123456',
        });
        break;

      case 'registrado':
        this.loginForm.setValue({
          email: 'nepokix903@anypng.com',
          password: '123123',
        });
        break;

      case 'anonimo':
        this.loginForm.setValue({
          email: 'joraxo1694@gianes.com',
          password: '123456',
        });
        break;

      default:
        console.warn(`Rol ${role} no reconocido`);
        break;
    }
  }

  BotonPrueba() {
    this.notificationService.showSuccess(
      'El pedido se ha guardado correctamente.',
      'Éxito',
      {
        position: 'top',
        customClass: {
          popup: 'high-priority-alert', // Clase CSS personalizada
        },
        timer: 4000,
        backdrop: true,
      }
    );
  }
}
