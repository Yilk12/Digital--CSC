# Chatbox System Setup Guide

## Overview
This guide will help you set up the real-time chatbox system for your Ethiopian Civil Service Commission Helpdesk and Knowledge Base.

## Features Implemented
✅ **Real-time messaging** with WebSocket support  
✅ **Department-based filtering** for internal users  
✅ **User type detection** (Internal/External)  
✅ **Private messaging** between users  
✅ **Group messaging** capabilities  
✅ **Right-side layout** with white-green color scheme  
✅ **Category selection** (Internal/External)  
✅ **Department dropdown** (hidden for external users)  

## Installation Steps

### 1. Install Dependencies

**Backend Dependencies:**
```bash
cd backend
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

**Frontend Dependencies:**
```bash
npm install socket.io-client
```

### 2. Database Setup

**Generate Prisma Client:**
```bash
cd backend
npx prisma generate
npx prisma db push
```

This will create the new chat-related tables:
- `conversations`
- `conversation_participants`  
- `messages`
- `message_attachments`
- `message_read_receipts`

### 3. Environment Variables

Add to your `.env` file:
```env
# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Backend API URL (for frontend)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Backend Configuration

The chat module has been automatically added to your `app.module.ts`. No additional configuration needed.

### 5. Frontend Integration

The chatbox is automatically integrated into your layout via the `ChatProvider` component.

## Usage

### For Internal Users
1. **Category Selection**: Choose "Internal" 
2. **Department Selection**: Select specific department or "All departments"
3. **Start Conversations**: 
   - Private: Click on any user to start 1-on-1 chat
   - Group: Create group conversations with multiple users
   - Department: Create department-wide conversations

### For External Users  
1. **Category Selection**: Choose "External Customer"
2. **No Department Selection**: Department dropdown is hidden
3. **Direct Chat**: Can only chat with internal staff members

## API Endpoints

### REST Endpoints
- `GET /chat/conversations` - Get user conversations
- `POST /chat/conversations` - Create new conversation
- `POST /chat/conversations/private` - Create/find private conversation
- `GET /chat/conversations/:id/messages` - Get conversation messages
- `POST /chat/messages` - Send message
- `GET /chat/users/available` - Get available users

### WebSocket Events
- `sendMessage` - Send a message
- `joinConversation` - Join conversation room
- `leaveConversation` - Leave conversation room
- `startTyping` / `stopTyping` - Typing indicators
- `getOnlineUsers` - Get list of online users

## UI Components

### Chatbox Features
- **Floating Button**: Green circular button in bottom-right corner
- **Expandable Interface**: Click to open full chat interface
- **Minimize/Maximize**: Control chat window size
- **Two Tabs**:
  - **Conversations**: View and manage existing chats
  - **New Chat**: Start new conversations with user search

### Styling
- **Color Scheme**: White background with green accents (`green-600`, `green-50`)
- **Layout**: Fixed position, bottom-right corner
- **Responsive**: Adapts to different screen sizes
- **Animations**: Smooth transitions and hover effects

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if backend server is running on correct port
   - Verify CORS settings in chat gateway
   - Ensure `FRONTEND_URL` environment variable is set

2. **Messages Not Sending**
   - Verify user authentication token
   - Check if user is participant in conversation
   - Ensure database connection is working

3. **Department Selection Not Working**
   - Verify user has `userType` and `department` fields populated
   - Check if departments are properly seeded in database

4. **UI Not Displaying**
   - Ensure `socket.io-client` is installed
   - Check browser console for JavaScript errors
   - Verify all UI components are properly imported

### Database Seeding

To test the chat system, ensure you have:
1. **Users** with different `userType` (INTERNAL/EXTERNAL)
2. **Departments** with proper names and IDs
3. **Authentication** working for user sessions

## Development Notes

### Backend Architecture
- **ChatModule**: Main module containing all chat functionality
- **ChatService**: Business logic for conversations and messages
- **ChatGateway**: WebSocket gateway for real-time communication
- **ChatController**: REST API endpoints

### Frontend Architecture
- **Chatbox Component**: Main UI component
- **ChatProvider**: Context provider for chat state
- **useChat Hook**: Custom hook for socket management
- **API Routes**: Next.js API routes for backend communication

### Security Considerations
- All chat endpoints require authentication
- Users can only access conversations they participate in
- WebSocket connections validate user identity
- Message content is sanitized

## Next Steps

1. **Test the System**: Create test users and try messaging
2. **Customize Styling**: Adjust colors and layout as needed
3. **Add File Uploads**: Extend for file sharing capabilities
4. **Implement Notifications**: Add push notifications for new messages
5. **Add Moderation**: Implement message moderation for external users

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify backend logs for WebSocket connections
3. Ensure all dependencies are properly installed
4. Test with different user types and departments
