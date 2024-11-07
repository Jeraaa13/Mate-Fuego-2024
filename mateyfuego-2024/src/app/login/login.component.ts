import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { IonicModule } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, IonicModule, CommonModule,RouterLink],
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
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
      this.router.navigate(['/home']);
    } catch (error) {
      this.errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
      console.error('Error during login: ', error);
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
          email: 'dueno@empresa.com',
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
          email: 'maitre@empresa.com',
          password: '123456',
        });
        break;

      case 'mozo':
        this.loginForm.setValue({
          email: 'mozo@empresa.com',
          password: '123456',
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
          email: 'registrado@empresa.com',
          password: '123456',
        });
        break;

      case 'anonimo':
        this.loginForm.setValue({
          email: 'anonimo@empresa.com',
          password: '123456',
        });
        break;

      default:
        console.warn(`Rol ${role} no reconocido`);
        break;
    }
  }
}
