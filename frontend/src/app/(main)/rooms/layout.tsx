"use client";

import { SocketProvider } from "@/providers/socket-provider";

type RoomsLayoutProps = {
  children: React.ReactNode;
};

const RoomsLayout = ({ children }: RoomsLayoutProps) => {
  return <SocketProvider>{children}</SocketProvider>;
};

export default RoomsLayout;
