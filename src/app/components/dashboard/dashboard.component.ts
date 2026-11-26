
import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject
} from '@angular/core';

import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { SocketService } from '../../core/services/socket.service';

import { ChatUser, AuthUser } from '../../models/auth.model';

import {
  ChatMessage,
  Conversation
} from '../../models/chat.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {

  private authService = inject(AuthService);
  private chatService = inject(ChatService);
  private socketService = inject(SocketService);

  @ViewChild('messageContainer')
  messageContainer!: ElementRef<HTMLDivElement>;

  currentUser: AuthUser | null = null;

  users: ChatUser[] = [];
  filteredUsers: ChatUser[] = [];

  selectedUser: ChatUser | null = null;
  selectedConversation: Conversation | null = null;

  messages: ChatMessage[] = [];

  searchText = '';
  messageText = '';

  loading = false;
  loadingMessages = false;
  sendingMessage = false;

  errorMessage = '';
  messageError = '';

  sidebarVisible = true;

  private removeMessageListener: (() => void) | null = null;

  ngOnInit(): void {
    this.currentUser = this.authService.getStoredUser();

    this.loadUsers();
    this.initializeSocket();
  }

  private initializeSocket(): void {
    const token = this.authService.getToken();

    if (!token) {
      this.authService.logout();
      return;
    }

    this.socketService.connect(token);

    this.removeMessageListener =
      this.socketService.onNewMessage(message => {

        // Only display messages for the currently selected chat.
        if (
          this.selectedConversation?.id === message.conversationId
        ) {
          const alreadyExists = this.messages.some(
            item => item.id === message.id
          );

          if (!alreadyExists) {
            this.messages.push(message);
            this.scrollToBottom();
          }
        }
      });
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.getUsers().subscribe({
      next: response => {
        this.users = response.users || [];
        this.filteredUsers = [...this.users];
        this.loading = false;
      },
      error: error => {
        this.loading = false;

        if (error.status === 401) {
          this.authService.logout();
          return;
        }

        this.errorMessage =
          error.error?.message || 'Unable to load users';
      }
    });
  }

  searchUsers(): void {
    const search = this.searchText.trim().toLowerCase();

    this.filteredUsers = !search
      ? [...this.users]
      : this.users.filter(user =>
          user.name.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
        );
  }

  selectUser(user: ChatUser): void {

    if (this.selectedConversation) {
      this.socketService.leaveConversation(
        this.selectedConversation.id
      );
    }

    this.selectedUser = user;
    this.selectedConversation = null;

    this.messages = [];
    this.messageError = '';
    this.loadingMessages = true;
    this.sidebarVisible = false;

    this.chatService.createOrGetConversation(user.id).subscribe({
      next: response => {

        const conversation = response.conversation;

        this.selectedConversation = conversation;

        // Load old messages from MongoDB.
        this.chatService.getMessages(conversation.id).subscribe({
          next: messageResponse => {
            if (
              this.selectedConversation?.id !== conversation.id
            ) {
              return;
            }

            this.messages = messageResponse.messages || [];
            this.loadingMessages = false;
            this.scrollToBottom();
          },
          error: error => {
            if (
              this.selectedConversation?.id !== conversation.id
            ) {
              return;
            }

            this.loadingMessages = false;
            this.messageError =
              error.error?.message || 'Unable to load messages';
          }
        });

        // Join Socket.IO room.
        this.socketService.joinConversation(
          conversation.id,
          response => {
            if (!response.success) {
              this.messageError =
                typeof response.message === 'string'
                  ? response.message
                  : 'Unable to join conversation';
            }
          }
        );
      },
      error: error => {
        this.loadingMessages = false;
        this.messageError =
          error.error?.message || 'Unable to open conversation';
      }
    });
  }

  sendMessage(): void {

    const content = this.messageText.trim();

    if (!content || !this.selectedConversation) {
      return;
    }

    if (content.length > 5000) {
      this.messageError = 'Message cannot exceed 5000 characters';
      return;
    }

    if (this.sendingMessage) {
      return;
    }

    this.sendingMessage = true;
    this.messageError = '';

    this.socketService.sendMessage(
      {
        conversationId: this.selectedConversation.id,
        content
      },
      response => {

        this.sendingMessage = false;

        if (!response.success) {
          this.messageError =
            typeof response.message === 'string'
              ? response.message
              : 'Message could not be sent';

          return;
        }

        this.messageText = '';
      }
    );
  }

  isMyMessage(message: ChatMessage): boolean {
    return message.sender.id === this.currentUser?.id;
  }

  getInitials(name: string): string {
    if (!name) {
      return '?';
    }

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const element = this.messageContainer?.nativeElement;

      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    }, 0);
  }

  showUserList(): void {
    this.sidebarVisible = true;
  }

  logout(): void {
    this.socketService.disconnect();
    this.authService.logout();
  }

  trackByUserId(index: number, user: ChatUser): string {
    return user.id;
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  ngOnDestroy(): void {
    this.removeMessageListener?.();

    if (this.selectedConversation) {
      this.socketService.leaveConversation(
        this.selectedConversation.id
      );
    }

    // Do not disconnect the app-wide socket just because
    // the dashboard component is destroyed.
  }
}
