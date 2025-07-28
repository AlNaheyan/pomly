"use client"

import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useState } from "react"

export function CreateRoomDialog() {
  const [open, setOpen] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [description, setDescription] = useState("")
  const [maxParticipants, setMaxParticipants] = useState("2")

  const handleCreate = () => {
    // Handle room creation logic here
    console.log({ roomName, description, maxParticipants })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Create Room</Button>
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
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="max-participants" className="text-sm font-medium">
              Max Participants
            </Label>
            <Select value={maxParticipants} onValueChange={(value) => setMaxParticipants(value)}>
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
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!roomName.trim()}>
            Create Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
