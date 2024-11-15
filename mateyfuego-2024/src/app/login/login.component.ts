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
import { NotificationService } from '../services/notification.service';
import { ErrorHandlerService } from '../services/error-handler.service';

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
    private notificationService: NotificationService,
    private errorHandler: ErrorHandlerService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['noVerified']) {
        this.notificationService.showError(
          'Tu cuenta aún no ha sido verificada por un administrador.',
          'Cuenta No Verificada'
        );
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
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      console.log('User logged in: ', userCredential);

      await this.checkUserInCollections(userCredential.user.uid);
    } catch (error) {
      console.error('Error during login: ', error);
      this.notificationService.showError(
        'Error al iniciar sesión. Verifica tus credenciales.',
        'Error de Inicio de Sesión'
      );
      this.errorHandler.vibrate();
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
      this.notificationService.showError(
        'No se encontró información del usuario en las colecciones.',
        'Usuario No Encontrado'
      );
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

      case 'Mozo':
        this.router.navigate(['/home-mozo']);
        break;

      case 'Cocinero':
        this.router.navigate(['/home-cocinero']);
        break;

      case 'Bartender':
        this.router.navigate(['/home-bartender']);
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
      this.errorHandler.vibrate();
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
          email: 'empleadovich@mail.om',
          password: '123123',
        });
        break;

      case 'bartender':
        this.loginForm.setValue({
          email: 'gesey55944@gianes.com',
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
}
