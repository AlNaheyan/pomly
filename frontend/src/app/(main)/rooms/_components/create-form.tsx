"use client";

import { useState } from "react";
import type { Socket } from "socket.io-client";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type CreateRoomDialogProps = {
  socket: Socket | null;
  disabled?: boolean;
  onCreated?: (roomId: string) => void;
};

export function CreateRoomDialog({
  socket,
  disabled,
  onCreated,
}: CreateRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("4");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = () => {
    if (!socket) {
      toast.error("Please sign in to create a room.");
      return;
    }

    if (!roomName.trim()) {
      toast.error("Room name is required.");
      return;
    }

    setIsSubmitting(true);

    socket.emit(
      "create-room",
      {
        name: roomName.trim(),
        description: description.trim(),
        maxParticipant: parseInt(maxParticipants, 10),
      },
      (response: any) => {
        setIsSubmitting(false);

        if (!response?.success) {
          toast.error(response?.error ?? "Unable to create room.");
          return;
        }

        toast.success("Room created!");
        setOpen(false);
        setRoomName("");
        setDescription("");
        setMaxParticipants("4");

        const roomId = response.room?.id;
        if (roomId) {
          onCreated?.(roomId);
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" disabled={disabled}>
          Create Room
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Room</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="room-name" className="text-sm font-medium">
              Room Name
            </Label>
            <Input
              id="room-name"
              placeholder="Enter room name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full"
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="What is this room for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="max-participants" className="text-sm font-medium">
              Max Participants
            </Label>
            <Select
              value={maxParticipants}
              onValueChange={(value) => setMaxParticipants(value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="max-participants">
                <SelectValue placeholder="Select max participants" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 9 }, (_, i) => i + 2).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} participants
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isSubmitting || !roomName.trim()}
          >
            {isSubmitting ? "Creating..." : "Create Room"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
