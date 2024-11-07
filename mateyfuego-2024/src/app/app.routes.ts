import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path : 'registro', loadComponent: () => 
      import('./paginas/registro/registro.component').then((m) => m.RegistroComponent)
  },
  {
    path : 'alta-dueno-supervisor', loadComponent: () => 
      import('./registros/registro-dueno-supervisor/registro-dueno-supervisor.component').then((m) => m.RegistroDuenoSupervisorComponent)
  },
  {
    path : 'alta-empleados', loadComponent: () => 
      import('./registros/alta-empleados/alta-empleados.component').then((m) => m.AltaEmpleadosComponent)
  }
];
