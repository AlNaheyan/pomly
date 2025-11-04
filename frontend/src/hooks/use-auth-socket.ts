"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import toast from "react-hot-toast";

import { createClient } from "@/utils/supabase/client";

const fallbackBackend = "http://localhost:3001";
const socketBase =
  process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "") ??
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ??
  fallbackBackend;

type UseAuthSocketResult = {
  socket: Socket | null;
  hasSession: boolean;
  isConnecting: boolean;
  reconnect: () => Promise<void>;
};

export function useAuthSocket(): UseAuthSocketResult {
  const supabase = useMemo(() => createClient(), []);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    let newSocket: Socket | null = null;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      setHasSession(Boolean(accessToken));

      if (!accessToken) {
        setSocket((current) => {
          current?.disconnect();
          return null;
        });
        return;
      }

      newSocket = io(socketBase, {
        auth: { token: accessToken },
        transports: ["websocket"],
        withCredentials: true,
      });

      newSocket.on("connect_error", (err) => {
        toast.error(`Socket connection failed: ${err.message}`);
      });

      setSocket((current) => {
        current?.disconnect();
        return newSocket;
      });
    } catch (error) {
      console.error(error);
      toast.error("Unable to connect to study rooms service.");
      setSocket((current) => {
        current?.disconnect();
        return null;
      });
    } finally {
      setIsConnecting(false);
    }
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;
    connect();

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }
      setHasSession(Boolean(session));
      connect();
    });

    return () => {
      isMounted = false;
      setSocket((current) => {
        current?.disconnect();
        return null;
      });
      authListener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    socket,
    hasSession,
    isConnecting,
    reconnect: connect,
  };
}
