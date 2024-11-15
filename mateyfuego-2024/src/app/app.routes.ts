import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
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
      import('./qr-propina/qr-propina.component').then(
        (m) => m.QrPropinaComponent
      ),
  },
  {
    path: 'registro-mesas',
    loadComponent: () =>
      import('./registros/registro-mesas/registro-mesas.component').then(
        (m) => m.RegistroMesasComponent
      ),
  },
  {
    path: 'registro-clientes',
    loadComponent: () =>
      import('./registros/registro-clientes/registro-clientes.component').then(
        (m) => m.RegistroClientesComponent
      ),
  },
  {
    path: 'home-empleados',
    loadComponent: () =>
      import('./encuestas/empleados/home.component').then(
        (m) => m.HomeComponent
      ),
  },
  {
    path: 'home-clientes',
    loadComponent: () =>
      import('./clientes/home/home.component').then((m) => m.HomeComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'home-dueno-supervisores',
    loadComponent: () =>
      import('./duenos-supervisores/home/home.component').then(
        (m) => m.HomeComponent
      ),
  },
  {
    path: 'home-mozo',
    loadComponent: () =>
      import('./mozo-home/mozo-home.component').then(
        (m) => m.MozoHomeComponent
      ),
  },
  {
    path: 'home-cocinero',
    loadComponent: () =>
      import('./cocinero-home/cocinero-home.component').then(
        (m) => m.CocineroHomeComponent
      ),
  },
  {
    path: 'home-bartender',
    loadComponent: () =>
      import('./bartender-home/bartender-home.component').then(
        (m) => m.BartenderHomeComponent
      ),
  },
  {
    path: 'encuestas-clientes',
    loadComponent: () =>
      import('./encuestas/clientes/clientes.component').then(
        (m) => m.EncuestaClienteComponent
      ),
  },
  {
    path: 'ver-encuesta-cliente',
    loadComponent: () =>
      import('./ver-encuesta/ver-encuesta.component').then(
        (m) => m.VerEncuestaComponent
      ),
  },
  {
    path: 'encuestas-supervisores',
    loadComponent: () =>
      import('./encuestas/supervisores/supervisores.component').then(
        (m) => m.SupervisorComponent
      ),
  },
  {
    path: 'lista-espera',
    loadComponent: () =>
      import('./lista-espera/lista-espera.component').then(
        (m) => m.ClienteHomeComponent
      ),
  },
  {
    path: 'home-maitre',
    loadComponent: () =>
      import('./maitre-home/maitre-home.component').then(
        (m) => m.MaitreHomeComponent
      ),
  },
  {
    path: 'productos/pagina',
    loadComponent: () =>
      import('./productos/pagina/pagina.component').then(
        (m) => m.PaginaComponent
      ),
  },
  {
    path: 'chat',
    loadComponent: () =>
      import('./productos/pagina/chat/chat.component').then(
        (m) => m.ChatComponent
      ),
  },
  {
    path: 'cliente-espera-pedido',
    loadComponent: () =>
      import('./cliente-espera-pedido/cliente-espera-pedido.component').then(
        (m) => m.ClienteEsperaPedidoComponent
      ),
  },
  {
    path: 'cliente-pedido-cuenta',
    loadComponent: () =>
      import('./cliente/pedido-cuenta/pedido-cuenta.component').then(
        (m) => m.PedidoCuentaComponent
      ),
  },
  {
    path: 'juegos',
    loadComponent: () =>
      import('./juegos/ahorcado/ahorcado.component').then(
        (m) => m.AhorcadoComponent
      ),
  },
];
