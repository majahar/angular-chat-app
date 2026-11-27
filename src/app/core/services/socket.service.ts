
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';


import {
  ChatMessage,
  SendMessagePayload,
  SocketAck
} from '../../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket: Socket | null = null;

  //private socketUrl = 'http://localhost:5000';
  //private socketUrl = environment.socketUrl;
  private socketUrl = 'https://chat-app-mc3t.onrender.com';

  

  private activeConversationId: string | null = null;
  private hasConnectedBefore = false;

  connect(token: string): void {

    // Avoid creating multiple socket connections.
    if (this.socket?.connected) {
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(this.socketUrl, {
      autoConnect: false,
      auth: {
        token
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
    console.log('Socket connected:', this.socket?.id);

    if (this.hasConnectedBefore && this.activeConversationId) {
    this.socket?.emit(
      'joinConversation',
      this.activeConversationId
    );
    }

    this.hasConnectedBefore = true;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.connect();
  }

 joinConversation(
  conversationId: string,
  callback: (response: SocketAck) => void
): void {

  this.activeConversationId = conversationId;

  const emitJoin = () => {
    this.socket?.emit(
      'joinConversation',
      conversationId,
      callback
    );
  };

  if (this.socket?.connected) {
    emitJoin();
  } else {
    this.socket?.once('connect', emitJoin);
  }
}

 leaveConversation(conversationId: string): void {

  if (this.activeConversationId === conversationId) {
    this.activeConversationId = null;
  }

  this.socket?.emit('leaveConversation', conversationId);
}

  sendMessage(
    payload: SendMessagePayload,
    callback: (response: SocketAck) => void
  ): void {

    if (!this.socket?.connected) {
      callback({
        success: false,
        message: 'Socket is not connected. Please try again.'
      });

      return;
    }

    this.socket.emit('sendMessage', payload, callback);
  }

  onNewMessage(
    callback: (message: ChatMessage) => void
  ): () => void {

    if (!this.socket) {
      return () => {};
    }

    this.socket.on('newMessage', callback);

    return () => {
      this.socket?.off('newMessage', callback);
    };
  }

 disconnect(): void {
  this.activeConversationId = null;
  this.hasConnectedBefore = false;

  this.socket?.disconnect();
  this.socket = null;
}
}
