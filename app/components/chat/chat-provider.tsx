'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Chatbox from './chatbox';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'INTERNAL' | 'EXTERNAL';
  department?: string;
}

interface Department {
  id: string;
  name: string;
}

interface ChatProviderProps {
  children: React.ReactNode;
  currentUser?: User;
  departments?: Department[];
}

const ChatContext = createContext<{
  currentUser?: User;
  departments: Department[];
}>({
  departments: [],
});

export function ChatProvider({ children, currentUser, departments }: ChatProviderProps) {
  const [user, setUser] = useState<User | undefined>(currentUser);
  const [depts, setDepts] = useState<Department[]>(departments ?? []);
  const pathname = usePathname();

  // Fetch current user if not provided
  useEffect(() => {
    if (!currentUser) {
      // You can implement user fetching logic here
      // For now, we'll use a mock user for demonstration
      // No-op: do not set a mock user
    }
  }, [currentUser]);

  // Fetch departments if not provided (run once)
  useEffect(() => {
    if (!departments || departments.length === 0) {
      // No-op: do not set mock departments
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ChatContext.Provider value={{ currentUser: user, departments: depts }}>
      {children}
      {user && (
        <Chatbox
          currentUser={user}
          departments={depts}
          defaultOpen={
            pathname === '/chat' ||
            pathname.startsWith('/messages') ||
            pathname === '/dashboard'
          }
        />
      )}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
