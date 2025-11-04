"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Clock, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateRoomDialog } from "./_components/create-form";
import type { RoomSummary } from "@/types/rooms";
import { useSocketContext } from "@/providers/socket-provider";

export default function RoomPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const { socket, hasSession, isConnecting: isConnectingSocket } =
    useSocketContext();

  const fetchRooms = useCallback(async () => {
    const baseUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ??
      "http://localhost:3001";
    try {
      const response = await fetch(`${baseUrl}/api/rooms`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to load rooms");
      }
      const data: RoomSummary[] = await response.json();
      setRooms(data);
    } catch (error) {
      console.error(error);
      toast.error("Could not load study rooms. Please try again.");
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleRoomUpdate = () => {
      fetchRooms();
    };

    socket.on("room-created", handleRoomUpdate);
    socket.on("user-joined", handleRoomUpdate);
    socket.on("user-left", handleRoomUpdate);

    return () => {
      socket.off("room-created", handleRoomUpdate);
      socket.off("user-joined", handleRoomUpdate);
      socket.off("user-left", handleRoomUpdate);
    };
  }, [fetchRooms, socket]);

  const handleJoinRoom = useCallback(
    (roomId: string) => {
      if (!socket) {
        toast.error("Please sign in to join a room.");
        router.push("/login");
        return;
      }

      router.push(`/rooms/${roomId}`);
    },
    [router, socket]
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Study Rooms</h1>
          <p className="text-muted-foreground mt-2">
            Join active study sessions or create your own.
          </p>
        </div>

        <CreateRoomDialog
          socket={socket}
          onCreated={(roomId) => {
            fetchRooms();
            router.push(`/rooms/${roomId}`);
          }}
          disabled={!hasSession || isConnectingSocket}
        />
      </div>

      {!hasSession && (
        <div className="mb-6 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          Sign in to create or join rooms. You can still browse active rooms
          below.
        </div>
      )}

      {isLoadingRooms ? (
        <div className="py-12 text-center text-muted-foreground">
          Loading rooms...
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No active rooms</h2>
          <p className="text-muted-foreground mb-4">
            Be the first to create a study room!
          </p>
          <CreateRoomDialog
            socket={socket}
            disabled={!hasSession || isConnectingSocket}
            onCreated={(roomId) => {
              fetchRooms();
              router.push(`/rooms/${roomId}`);
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{room.name}</CardTitle>
                    <CardDescription className="mt-1">
                      Code:{" "}
                      <span className="font-mono font-semibold">
                        {room.room_code}
                      </span>
                    </CardDescription>
                  </div>
                  {room.is_timer_active && (
                    <Badge variant="secondary">
                      <Clock className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  {room.description || "No description"}
                </p>

                <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {room.participants}/{room.max_participants}
                  </span>
                  <span>Host: {room.host_name}</span>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={!hasSession || isConnectingSocket}
                >
                  Join Room
                </Button>
                <Button
                  className="mt-2 w-full"
                  variant="outline"
                  asChild
                >
                  <Link href={`/rooms/${room.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
