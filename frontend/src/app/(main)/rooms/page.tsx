"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CreateRoomDialog } from "./_components/create-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";


const mockRooms = [
    {
        id: "1",
        room_code: "ABC123",
        name: "Study Session #1",
        description: "Focused study for finals",
        participants: 3,
        max_participants: 8,
        is_timer_active: true,
        host_name: "John Doe",
    },
    {
        id: "2",
        room_code: "DEF456",
        name: "Math Group Study",
        description: "Working on calculus problems",
        participants: 5,
        max_participants: 10,
        is_timer_active: false,
        host_name: "Jane Smith",
    },
];

export default function RoomPage() {
    const [rooms, setRooms] = useState(mockRooms);

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Study Rooms</h1>
                    <p className="text-muted-foreground mt-2">
                        Join active study sessions or create your own
                    </p>
                </div>

                <CreateRoomDialog />
            </div>

            {rooms.length === 0 ? (
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold mb-2">
                        No active rooms
                    </h2>
                    <p className="text-muted-foreground mb-4">
                        Be the first to create a study room!
                    </p>
                    <CreateRoomDialog />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rooms.map((room) => (
                        <Card
                            key={room.id}
                            className="hover:shadow-md transition-shadow"
                        >
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">
                                            {room.name}
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            Code:{" "}
                                            <span className="font-mono font-semibold">
                                                {room.room_code}
                                            </span>
                                        </CardDescription>
                                    </div>
                                    {room.is_timer_active && (
                                        <Badge variant="secondary">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Active
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {room.description || "No description"}
                                </p>

                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Users className="w-4 h-4 mr-1" />
                                        {room.participants}/
                                        {room.max_participants}
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        Host: {room.host_name}
                                    </span>
                                </div>

                                <Link href={`/rooms/${room.id}`}>
                                    <Button className="w-full">
                                        Join Room
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
