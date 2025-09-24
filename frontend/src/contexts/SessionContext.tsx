import React, { createContext, useContext, ReactNode } from 'react';

interface Session {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: Date;
  messageCount: number;
}

interface SessionContextType {
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: ReactNode;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children, updateSession }) => {
  return (
    <SessionContext.Provider value={{ updateSession }}>
      {children}
    </SessionContext.Provider>
  );
};