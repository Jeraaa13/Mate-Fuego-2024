import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';


@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, IonicModule, CommonModule,RouterLink],

})
export class RegistroComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
