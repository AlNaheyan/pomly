"use client";

import { createContext, useContext } from "react";
import type { Socket } from "socket.io-client";

import { useAuthSocket } from "@/hooks/use-auth-socket";

type SocketContextValue = {
  socket: Socket | null;
  hasSession: boolean;
  isConnecting: boolean;
  reconnect: () => Promise<void>;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  hasSession: false,
  isConnecting: false,
  reconnect: async () => {},
});

type SocketProviderProps = {
  children: React.ReactNode;
};

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const value = useAuthSocket();

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
