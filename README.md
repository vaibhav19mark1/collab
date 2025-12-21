# Collab - Real-time Collaborative Document Editor

A powerful, real-time collaborative workspace built with Next.js, featuring rich text editing, live cursors, room management, and persistent document storage.

## Features

### 🏠 Room Management

- **Create & Join Rooms**: Create collaborative workspaces with unique room codes
- **Room Access Control**:
  - Public and private rooms
  - Password protection
  - Maximum participant limits (2-100 users)
  - Room invitations via email
- **Participant Management**:
  - Owner, admin, and member roles
  - Kick and ban capabilities
  - User presence indicators with custom avatars and colors
- **Room Settings**: Configure room name, description, privacy, and participant limits

### ✍️ Rich Text Editor

- **Collaborative Editing**: Real-time document collaboration powered by Yjs
- **Rich Formatting**:
  - Text styling (bold, italic, underline, strikethrough)
  - Headings (H1-H6)
  - Lists (bullet, ordered, task lists)
  - Code blocks with syntax highlighting
  - Tables, images, and links
  - Text alignment and colors
  - Font family customization
- **Live Cursors**: See other users' cursors and selections in real-time
- **Persistent Storage**: All document changes saved to MongoDB
- **Floating Toolbar**: Context-aware formatting toolbar

### 💬 Real-time Chat

- **Room Chat**: Built-in chat for each collaborative room
- **Typing Indicators**: See when others are typing
- **Message History**: Persistent chat history stored in MongoDB
- **User Avatars**: Visual user identification in chat

### 👤 User Profiles

- **Profile Management**: Edit name and profile picture
- **Avatar Upload**: Cloudinary integration for image uploads
- **User Stats**: Track rooms created and joined

### 🎨 UI/UX

- **Dark Mode**: System-aware theme with manual toggle
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Skeleton Loaders**: Smooth loading states
- **Toast Notifications**: Real-time feedback for actions
- **Modern UI**: Built with Shadcn UI and Tailwind CSS

## 🛠️ Tech Stack

### Frontend

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Component Library**: [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: Lucide React
- **State Management**: Zustand
- **Theme**: next-themes

### Backend

- **Runtime**: Node.js
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Real-time Communication**: Socket.io
- **Collaborative Editing**: Yjs with y-mongodb-provider
- **File Upload**: Cloudinary
- **Email**: Resend

### Real-time Architecture

- **Socket.io Server**: Handles room events, chat, and user presence
- **Yjs WebSocket Server**: Manages collaborative document editing
- **MongoDB Persistence**: Stores Yjs documents and application data

### Editor

- **Tiptap**: Extensible rich text editor framework
- **Extensions**: 30+ Tiptap extensions for comprehensive formatting
- **Collaboration**: @tiptap/extension-collaboration
- **Syntax Highlighting**: Lowlight for code blocks

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance
- pnpm (recommended) or npm

### Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/collab

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Socket.io
SOCKET_IO_PORT=3001
SOCKET_ADMIN_KEY=your-admin-key
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Yjs Server
YJS_PORT=3002
NEXT_PUBLIC_YJS_URL=ws://localhost:3002

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Resend (for email invitations)
RESEND_API_KEY=your-resend-api-key
```

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/collab.git
   cd collab
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start MongoDB**

   ```bash
   # If using local MongoDB
   mongod
   ```

4. **Run the development servers**

   ```bash
   pnpm dev
   ```

   This will start:

   - Next.js app on `http://localhost:3000`
   - Socket.io server on `http://localhost:3001`
   - Yjs WebSocket server on `ws://localhost:3002`

### Available Scripts

```bash
# Development
pnpm dev              # Run all servers concurrently
pnpm dev:next         # Run Next.js only
pnpm dev:socket       # Run Socket.io server only
pnpm dev:yjs          # Run Yjs server only

# Production
pnpm build            # Build Next.js app
pnpm start            # Start Next.js production server
pnpm start:servers    # Start Socket.io and Yjs servers

# Code Quality
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript type checking
```

## 🏗️ Architecture

### Real-time Communication Flow

1. **Socket.io Server** (`server/socket.ts`):

   - Handles room events (join, leave, kick, ban)
   - Manages chat messages and typing indicators
   - Broadcasts participant updates
   - HTTP endpoint for server-side event emission

2. **Yjs Server** (`server/yjs-server.ts`):

   - Manages collaborative document state
   - Syncs document updates between clients
   - Handles awareness (cursors, selections)
   - Persists documents to MongoDB
   - Debounced batch updates for performance

3. **Client-side Integration**:
   - `useSocket` hook for Socket.io connection
   - `useYjsProvider` hook for Yjs document sync
   - Zustand stores for state management
   - Optimistic UI updates

### Data Persistence

- **Documents**: Stored as Yjs binary updates in MongoDB
- **Rooms**: Full room metadata and participant lists
- **Messages**: Chat history with timestamps
- **Users**: Profile information and authentication data
- **Invites**: Email invitations with expiration

## 🔐 Authentication

- **NextAuth.js v5**: Modern authentication solution
- **Credentials Provider**: Email/password authentication
- **MongoDB Adapter**: Session and user storage
- **Protected Routes**: Middleware-based route protection

## 🎨 Theming

- **System-aware**: Automatically detects OS theme preference
- **Manual Toggle**: Switch between light and dark modes
- **Persistent**: Theme preference saved to localStorage
- **Shadcn Variables**: Consistent theming across components

## 📦 Deployment

### Vercel (Recommended for Next.js)

1. Deploy the Next.js app to Vercel
2. Deploy Socket.io and Yjs servers separately (Railway, Render, etc.)
3. Update environment variables with production URLs

### Environment Considerations

- Ensure MongoDB is accessible from all servers
- Configure CORS for Socket.io and Yjs servers
- Use secure WebSocket connections (wss://) in production
- Set up proper authentication for Socket.io server

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [Tiptap](https://tiptap.dev/) - Extensible rich text editor
- [Yjs](https://yjs.dev/) - CRDT framework for real-time collaboration
- [Shadcn UI](https://ui.shadcn.com/) 
- [Next.js](https://nextjs.org/) 
- [Socket.io](https://socket.io/) 
