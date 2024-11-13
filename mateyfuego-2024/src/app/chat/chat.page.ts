import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ChatService } from '../services/chat.service';

interface ChatMessage {
  text: string;
  user: string;
  timestamp: any;
  mesaNumero: number;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class ChatPage implements OnInit {
  message: string = '';
  messages: ChatMessage[] = [];
  user: any;
  private messagesSubscription?: Subscription;

  constructor(
    public authService: AuthService,
    private router: Router,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    this.authService.getCurrentUser().then((user) => {
      if (!user) {
        this.router.navigate(['/login']);
      } else {
        this.messagesSubscription = this.chatService
          .getMessages()
          .subscribe((messages) => {
            this.messages = messages as ChatMessage[];
          });
      }
    });
  }

  ngOnDestroy() {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
  }

  sendMessage() {
    if (this.message.trim() !== '') {
      this.chatService.sendMessage(this.message);
      this.message = '';
    }
  }

  volverAlHome() {
    this.router.navigate(['/home']);
  }
}
