import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { MailService } from '../services/mail.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';


@Component({
  selector: 'app-cliente-home',
  templateUrl: './cliente-home.component.html',
  styleUrls: ['./cliente-home.component.scss'],
  standalone: true,
  imports: [ZXingScannerModule, CommonModule],
})
export class ClienteHomeComponent implements OnInit {
  currentUser: any | null = null;

  constructor(
    private firestore: AngularFirestore,
    private mailService: MailService,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit(): void {
    this.afAuth.authState.subscribe((user) => {
      this.currentUser = user;
      console.log('Usuario logueado:', this.currentUser);
    });
  }
}
