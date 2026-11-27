
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

import {
  ConversationResponse,
  MessagesResponse
} from '../../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private http = inject(HttpClient);

  //private apiUrl = 'http://localhost:5000/api';
 //  private apiUrl = environment.apiUrl;
 // private socketUrl = environment.socketUrl;
     private apiUrl = 'https://chat-app-mc3t.onrender.com/api';
     private socketUrl = 'https://chat-app-mc3t.onrender.com';
  createOrGetConversation(receiverId: string) {
    return this.http.post<ConversationResponse>(
      `${this.apiUrl}/conversations`,
      { receiverId }
    );
  }

  getMessages(conversationId: string) {
    return this.http.get<MessagesResponse>(
      `${this.apiUrl}/conversations/${conversationId}/messages`
    );
  }
}
