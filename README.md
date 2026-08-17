# Mate & Fuego

<img src="./readmeFotos/iconoapp.png" alt="App icon" width="200">

Restaurant management app built as the final integrative project (Trabajo Integrador Final) for
the Computer Programming degree at UTN. Covers the full flow of a restaurant visit: table
assignment via QR, ordering, kitchen/bar preparation, tips, surveys, and role-based dashboards
for every staff role (owner, supervisor, maitre, waiter, cook, bartender).

Team project, built with Juan Manuel Portela and Quimey Rojo over five sprints.

## Stack

Ionic + Angular 18 (Capacitor for native builds), Firebase (Auth, Firestore, Cloud Functions,
Cloud Messaging), Chart.js, Howler (sound), QR scanning via ZXing / barcode-scanner.

## Known limitations

- Client registration with a profile photo requires a Firebase Storage bucket on the Blaze
  (pay-as-you-go) plan. This demo project is on the free Spark plan, so photo upload to Storage
  fails with a CORS/404 error. The rest of the app works normally.
- Push notifications depend on a separate notification server (not included in this repo).

## Running locally

```bash
cd mateyfuego-2024
npm install
ng serve
```

`npm install` used to fail on a peer dependency conflict between `@capacitor/core@6` and the
(now unmaintained) `@capacitor-community/barcode-scanner@4`, which only supports Capacitor 5.
Fixed via `.npmrc` (`legacy-peer-deps=true`) since replacing the scanner library would require a
rewrite untestable without a physical device.

## Sprint history

### Sprint 1 (Oct 26 - Nov 9, 2024)

- Employee sign-up - Quimey Rojo
- Owner/supervisor sign-up - Quimey Rojo
- Customer sign-up - Juan Manuel Portela
- Table creation - Juan Manuel Portela
- Product creation - Gerardo Toranzo
- Login - Gerardo Toranzo
- App icon and splash screen - Gerardo Toranzo
- Venue entry QR - Gerardo Toranzo
- Table QR - Juan Manuel Portela
- Tip QR - Quimey Rojo

### Sprint 2 (Nov 9-11, 2024)

- Table assignment - Juan Manuel Portela
- Venue entry flow - Juan Manuel Portela
- Order placing - Quimey Rojo
- Order cart - Quimey Rojo
- Bartender section - Juan Manuel Portela
- Estimated order time - Quimey Rojo
- Order prep and handoff to waiter - Quimey Rojo
- Venue entry QR - Gerardo Toranzo
- Waitlist QR - Juan Manuel Portela
- Table QR - Juan Manuel Portela / Gerardo Toranzo / Quimey Rojo
- Owner/supervisor approves customer entry - Juan Manuel Portela
- Maitre approves waitlist entry - Juan Manuel Portela

### Sprint 3 (Nov 11-13, 2024)

- Email notifications - Gerardo Toranzo
- 3 push notification types - Gerardo Toranzo / Quimey Rojo / Juan Manuel Portela
- Chat - Quimey Rojo
- Waiter's order list - Juan Manuel Portela
- Cook's order list - Gerardo Toranzo
- Order bill - Quimey Rojo
- Post-order section - Quimey Rojo
- Order status section - Gerardo Toranzo
- Styling - Gerardo Toranzo / Juan Manuel Portela / Quimey Rojo
- Page transition sounds - Gerardo Toranzo
- Error vibration feedback - Gerardo Toranzo

### Sprint 4 (Nov 13-15, 2024)

- Fixed leftover English strings - Gerardo Toranzo
- Fixed spacing in order status and enlarged bill amount - Juan Manuel Portela
- Larger product cards in order list, better cart visibility - Quimey Rojo

### Sprint 5 (Nov 15-17, 2024)

- 10%-discount minigame - Quimey Rojo

## QR codes

### Venue entry QR

<img src="./readmeFotos/Codigo QR ingreso al local.png" alt="Venue entry QR" width="200">

### Tip QRs

| 0% | 5% | 10% | 15% | 20% |
|---|---|---|---|---|
| ![0%](./readmeFotos/PropinasQR/0%25.png) | ![5%](./readmeFotos/PropinasQR/5%25.png) | ![10%](./readmeFotos/PropinasQR/10%25.png) | ![15%](./readmeFotos/PropinasQR/15%25.png) | ![20%](./readmeFotos/PropinasQR/20%25.png) |

## App tour

### Customer interface

**Entry:** on opening the app, the customer can log in, register as a regular customer, or
continue as an anonymous customer.

![Login and registration](./readmeFotos/login-registros.png?qraw=true)

**Getting in:** the customer scans a QR to join the waitlist. Once accepted and assigned a
table, they scan that table's QR (and no other).

![Customer enters the table](./readmeFotos/ingreso-cliente.png?qraw=true)

**Ordering:** the customer can chat with the waiter or place an order.

![Placing an order](./readmeFotos/pedido.png?qraw=true)

**After ordering:** the customer can confirm receipt, rescan the table QR to check order status,
and once the order arrives, request the bill or fill out the survey.

![Waiting for the order](./readmeFotos/espera-del-pedido.png?qraw=true)

**Bill:** the customer requests the bill, scans a QR to leave a tip, and can play a minigame for
a first-try discount. After paying, they wait for the waiter's confirmation.

![Order bill](./readmeFotos/cuenta-del-pedido.png?qraw=true)

**Survey results:** on leaving, the customer can rescan the venue entry QR to see survey charts.

![Survey charts](./readmeFotos/estadisticas.png?qraw=true)

### Staff interface

**Owner/supervisor and maitre:** approve customers entering the venue and joining the waitlist.

![Owner, supervisor and maitre tasks](./readmeFotos/dueno-maitre.png?qraw=true)

**Bartender, cook and waiter:** the bartender and cook prepare orders and hand them back to the
waiter. Orders are split by product, so prep time follows the slowest item. The waiter routes
orders to the right section, delivers them to the customer, and confirms payment.

![Bartender, waiter and cook tasks](./readmeFotos/empleados-menu.png?qraw=true)

## Push notifications and email

Examples of the emails sent when a customer enters the app and gets approved, and one of the
push notifications sent throughout the flow.

![Notifications](./readmeFotos/mails-push.png?qraw=true)
