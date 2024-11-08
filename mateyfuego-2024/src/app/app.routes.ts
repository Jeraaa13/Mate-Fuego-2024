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
    path: 'registro',
    loadComponent: () =>
      import('./paginas/registro/registro.component').then(
        (m) => m.RegistroComponent
      ),
  },
  {
    path: 'alta-dueno-supervisor',
    loadComponent: () =>
      import(
        './registros/registro-dueno-supervisor/registro-dueno-supervisor.component'
      ).then((m) => m.RegistroDuenoSupervisorComponent),
  },
  {
    path: 'alta-empleados',
    loadComponent: () =>
      import('./registros/alta-empleados/alta-empleados.component').then(
        (m) => m.AltaEmpleadosComponent
      ),
  },
  {
    path: 'alta-productos',
    loadComponent: () =>
      import(
        './registros/registro-productos/registro-productos.component'
      ).then((m) => m.RegistroProductosComponent),
  },
  {
    path: 'qr-propina',
    loadComponent: () =>
      import(
        './qr-propina/qr-propina.component'
      ).then((m) => m.QrPropinaComponent),
  },
  {
    path: 'registro-mesas',
    loadComponent: () =>
      import(
        './registros/registro-mesas/registro-mesas.component'
      ).then((m) => m.RegistroMesasComponent),
  },
  {
    path: 'registro-clientes',
    loadComponent: () =>
      import(
        './registros/registro-clientes/registro-clientes.component'
      ).then((m) => m.RegistroClientesComponent),
  },
];
