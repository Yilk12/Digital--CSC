# Chat Integration with Backend

## Overview
The chat interface has been fully integrated with the backend API and WebSocket services. This provides real-time messaging capabilities for the ECSC Help-Desk system.

## Features Implemented

### 🔧 Backend Integration
- **REST API Integration**: Full integration with chat endpoints
- **WebSocket Real-time**: Live messaging with Socket.IO
- **Authentication**: JWT token-based authentication
- **Error Handling**: Comprehensive error management

### 📱 Frontend Features
- **Conversations List**: Sidebar with all user conversations
- **Real-time Messaging**: Instant message delivery and updates
- **User Management**: Online/offline status indicators
- **New Chat Creation**: Start conversations with available users
- **Message History**: Load and display conversation history
- **Responsive Design**: Works on desktop and mobile

## API Endpoints Used

### REST API
- `GET /chat/conversations` - Get user conversations
- `POST /chat/conversations` - Create new conversation
- `GET /chat/conversations/:id/messages` - Get conversation messages
- `POST /chat/messages` - Send a message
- `GET /chat/users/available` - Get available users
- `POST /chat/conversations/private` - Create private conversation

### WebSocket Events
- `authenticate` - Authenticate user connection
- `joinConversation` - Join a conversation room
- `leaveConversation` - Leave a conversation room
- `sendMessage` - Send a message via WebSocket
- `newMessage` - Receive new messages
- `userOnline` - User comes online
- `userOffline` - User goes offline

## Configuration

### Environment Variables
Create a `.env.local` file with:
```env
NEXT_PUBLIC_API_URL=http://localhost:3005
```

### Backend Requirements
- NestJS backend running on port 3005
- Socket.IO WebSocket server
- JWT authentication
- Chat module with all endpoints implemented

## File Structure

```
app/
├── chat/
│   └── page.tsx                 # Main chat interface
├── lib/
│   ├── api.ts                   # Base API utilities
│   └── chat-api.ts              # Chat-specific API functions
hooks/
└── use-chat-websocket.ts        # WebSocket hook for real-time chat
```

## Usage

### Starting a Chat
1. Click the "+" button in the conversations sidebar
2. Select a user from the available users list
3. A new conversation will be created automatically

### Sending Messages
1. Select a conversation from the sidebar
2. Type your message in the input field
3. Press Enter or click the send button
4. Messages are sent via WebSocket for real-time delivery

### Real-time Features
- **Live Updates**: Messages appear instantly without refresh
- **Online Status**: See which users are online/offline
- **Connection Status**: Visual indicator of WebSocket connection
- **Error Handling**: Automatic error display and recovery

## Data Types

### ChatMessage
```typescript
interface ChatMessage {
  id: string;
  content: string;
  type: 'TEXT' | 'FILE' | 'IMAGE' | 'SYSTEM';
  senderId: string;
  sender: ChatUser;
  conversationId: string;
  replyToId?: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### ChatConversation
```typescript
interface ChatConversation {
  id: string;
  name?: string;
  type: 'PRIVATE' | 'GROUP' | 'DEPARTMENT';
  departmentId?: string;
  participants: ChatUser[];
  lastMessage?: ChatMessage;
  unreadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### ChatUser
```typescript
interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'INTERNAL' | 'EXTERNAL';
  department?: string;
  isOnline?: boolean;
}
```

## Error Handling

The chat interface includes comprehensive error handling:
- **Connection Errors**: WebSocket connection failures
- **API Errors**: REST API request failures
- **Authentication Errors**: Invalid or expired tokens
- **User Feedback**: Clear error messages with dismiss options

## Security

- **JWT Authentication**: All API calls include authentication headers
- **WebSocket Security**: Authenticated WebSocket connections
- **Input Validation**: Message content validation
- **Rate Limiting**: Backend rate limiting for message sending

## Performance

- **Optimistic Updates**: Messages appear immediately
- **Lazy Loading**: Messages loaded on demand
- **Connection Management**: Automatic reconnection on disconnect
- **Memory Management**: Proper cleanup of WebSocket connections

## Testing

To test the chat integration:
1. Start the backend server on port 3005
2. Ensure WebSocket server is running
3. Navigate to `/chat` in the frontend
4. Create a conversation and send messages
5. Test real-time features with multiple browser tabs

## Troubleshooting

### Common Issues
1. **Connection Failed**: Check if backend is running on correct port
2. **Authentication Error**: Verify JWT token is valid
3. **Messages Not Sending**: Check WebSocket connection status
4. **Users Not Loading**: Verify API endpoint is accessible

### Debug Mode
Enable console logging to debug issues:
- WebSocket connection events
- API request/response logs
- Error messages and stack traces
