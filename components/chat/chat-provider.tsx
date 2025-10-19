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
      const mockUser: User = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        userType: 'INTERNAL',
        department: 'IT',
      };
      setUser(mockUser);
    }
  }, [currentUser]);

  // Fetch departments if not provided (run once)
  useEffect(() => {
    if (!departments || departments.length === 0) {
      const mockDepartments: Department[] = [
        { id: 'IT', name: 'Information Technology' },
        { id: 'HR', name: 'Human Resources' },
        { id: 'Finance', name: 'Finance' },
        { id: 'Operations', name: 'Operations' },
        { id: 'Legal', name: 'Legal Affairs' },
      ];
      setDepts(mockDepartments);
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
