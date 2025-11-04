"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  BadgeCheck,
  Clock,
  Loader2,
  Mic,
  MicOff,
  Pause,
  Play,
  Users,
  Volume2,
  VolumeX,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import type {
  RoomDetail,
  RoomParticipant,
  TimerState,
} from "@/types/rooms";
import { useSocketContext } from "@/providers/socket-provider";

const fallbackBackend = "http://localhost:3001";
const apiBase =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ?? fallbackBackend;

type RemoteStream = {
  userId: string;
  stream: MediaStream;
};

const TIMER_LABELS: Record<TimerState["type"], string> = {
  work: "Work",
  break: "Break",
  long_break: "Long Break",
};

const formatSeconds = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(safeSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${secs}`;
};

const RemoteAudio = ({ stream }: { stream: MediaStream }) => {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (element) {
      element.srcObject = stream;
    }

    return () => {
      if (element) {
        element.srcObject = null;
      }
    };
  }, [stream]);

  return <audio ref={ref} autoPlay />;
};

export default function RoomDetailPage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const roomId = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId;

  const { socket, hasSession, isConnecting } = useSocketContext();
  const supabase = useMemo(() => createClient(), []);

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isTimerBusy, setIsTimerBusy] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);

  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const participantsRef = useRef<string[]>([]);
  const joinedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (isMounted) {
          setCurrentUserId(data.user?.id ?? null);
        }
      })
      .catch(() => {
        setCurrentUserId(null);
      });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const fetchRoom = useCallback(async () => {
    if (!roomId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/rooms/${roomId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch room");
      }

      const data: RoomDetail = await response.json();
      setRoom(data);
    } catch (error) {
      console.error(error);
      toast.error("Unable to load room details.");
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  useEffect(() => {
    if (room) {
      participantsRef.current = room.participants.map((participant) => participant.id);
    }
  }, [room]);

  const cleanupConnections = useCallback(() => {
    Object.values(peerConnectionsRef.current).forEach((pc) => {
      try {
        pc.close();
      } catch (error) {
        console.error("Error closing peer connection", error);
      }
    });
    peerConnectionsRef.current = {};
    setRemoteStreams([]);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localAudioRef.current) {
      localAudioRef.current.srcObject = null;
    }

    setIsAudioEnabled(false);
  }, []);

  const createPeerConnection = useCallback(
    (targetUserId: string) => {
      let connection = peerConnectionsRef.current[targetUserId];
      if (connection) {
        return connection;
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit("webrtc-ice-candidate", {
            targetUserId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (!stream) return;

        setRemoteStreams((prev) => {
          const existing = prev.find((item) => item.userId === targetUserId);
          if (existing) {
            return prev.map((item) =>
              item.userId === targetUserId ? { ...item, stream } : item
            );
          }
          return [...prev, { userId: targetUserId, stream }];
        });
      };

      pc.onconnectionstatechange = () => {
        if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
          setRemoteStreams((prev) =>
            prev.filter((item) => item.userId !== targetUserId)
          );
          pc.close();
          delete peerConnectionsRef.current[targetUserId];
        }
      };

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      peerConnectionsRef.current[targetUserId] = pc;
      return pc;
    },
    [socket]
  );

  const sendOffer = useCallback(
    async (targetUserId: string) => {
      if (!socket || !localStreamRef.current) return;

      try {
        const pc = createPeerConnection(targetUserId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("webrtc-offer", {
          targetUserId,
          offer,
        });
      } catch (error) {
        console.error("Failed to create WebRTC offer", error);
      }
    },
    [createPeerConnection, socket]
  );

  const enableAudio = useCallback(async () => {
    if (isAudioEnabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      setIsAudioEnabled(true);

      if (room) {
        room.participants
          .filter((participant) => participant.id !== currentUserId)
          .forEach((participant) => {
            sendOffer(participant.id);
          });
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to access microphone.");
    }
  }, [currentUserId, isAudioEnabled, room, sendOffer]);

  const disableAudio = useCallback(() => {
    cleanupConnections();
  }, [cleanupConnections]);

  useEffect(() => {
    if (!socket || !roomId || !hasSession || joinedRef.current) return;

    socket.emit("join-room", roomId, (response: any) => {
      if (!response?.success) {
        const message = response?.error ?? "Failed to join room.";
        setJoinError(message);
        toast.error(message);
        return;
      }

      joinedRef.current = true;

      if (response.room) {
        setRoom(response.room);
      } else {
        fetchRoom();
      }
    });

    return () => {
      if (joinedRef.current) {
        socket.emit("leave-room");
        joinedRef.current = false;
      }
      disableAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, roomId, hasSession]);

  useEffect(() => {
    if (!socket) return;

    const handleParticipantsUpdate = (participants: RoomParticipant[]) => {
      const participantIds = participants.map((participant) => participant.id);

      setRoom((prev) =>
        prev
          ? {
              ...prev,
              participants,
            }
          : prev
      );

      const existingIds = new Set(participantsRef.current);
      const newParticipants = participants.filter(
        (participant) =>
          participant.id !== currentUserId && !existingIds.has(participant.id)
      );

      if (isAudioEnabled) {
        newParticipants.forEach((participant) => {
          sendOffer(participant.id);
        });
      }

      participantsRef.current = participantIds;

      const participantSet = new Set(participantIds);
      Object.keys(peerConnectionsRef.current).forEach((userId) => {
        if (!participantSet.has(userId)) {
          const pc = peerConnectionsRef.current[userId];
          pc.close();
          delete peerConnectionsRef.current[userId];
          setRemoteStreams((prev) =>
            prev.filter((stream) => stream.userId !== userId)
          );
        }
      });
    };

    const handleUserJoined = (payload: { participants: RoomParticipant[] }) => {
      handleParticipantsUpdate(payload.participants);
    };

    const handleUserLeft = (payload: { participants: RoomParticipant[] }) => {
      handleParticipantsUpdate(payload.participants || []);
    };

    const handleMuteChanged = (payload: {
      userId: string;
      is_muted: boolean;
    }) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              participants: prev.participants.map((participant) =>
                participant.id === payload.userId
                  ? { ...participant, is_muted: payload.is_muted }
                  : participant
              ),
            }
          : prev
      );
    };

    const handleTimerStarted = (timer: TimerState) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              timer: {
                ...prev.timer,
                ...timer,
                is_active: true,
              },
            }
          : prev
      );
    };

    const handleTimerUpdate = (payload: {
      time_remaining: number;
      type: TimerState["type"];
      session_count: number;
    }) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              timer: {
                ...prev.timer,
                time_remaining: payload.time_remaining,
                type: payload.type,
                session_count: payload.session_count,
              },
            }
          : prev
      );
    };

    const handleTimerPaused = (timer: TimerState) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              timer: { ...prev.timer, ...timer, is_active: false },
            }
          : prev
      );
    };

    const handleTimerStopped = (timer: TimerState) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              timer,
            }
          : prev
      );
    };

    const handleTimerCompleted = (payload: {
      type: TimerState["type"];
      session_count: number;
    }) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              timer: {
                ...prev.timer,
                is_active: false,
                type: payload.type,
                session_count: payload.session_count,
              },
            }
          : prev
      );
      toast.success("Timer completed!");
    };

    const handleOffer = async (payload: {
      offer: RTCSessionDescriptionInit;
      fromUserId: string;
    }) => {
      try {
        const pc = createPeerConnection(payload.fromUserId);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("webrtc-answer", {
          targetUserId: payload.fromUserId,
          answer,
        });
      } catch (error) {
        console.error("Error handling WebRTC offer", error);
      }
    };

    const handleAnswer = async (payload: {
      answer: RTCSessionDescriptionInit;
      fromUserId: string;
    }) => {
      try {
        const pc = peerConnectionsRef.current[payload.fromUserId];
        if (!pc) return;
        await pc.setRemoteDescription(
          new RTCSessionDescription(payload.answer)
        );
      } catch (error) {
        console.error("Error handling WebRTC answer", error);
      }
    };

    const handleIceCandidate = async (payload: {
      candidate: RTCIceCandidateInit;
      fromUserId: string;
    }) => {
      try {
        const pc = createPeerConnection(payload.fromUserId);
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (error) {
        console.error("Error adding ICE candidate", error);
      }
    };

    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("user-mute-changed", handleMuteChanged);
    socket.on("timer-started", handleTimerStarted);
    socket.on("timer-update", handleTimerUpdate);
    socket.on("timer-paused", handleTimerPaused);
    socket.on("timer-stop", handleTimerStopped);
    socket.on("timer-completed", handleTimerCompleted);
    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice-candidate", handleIceCandidate);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("user-mute-changed", handleMuteChanged);
      socket.off("timer-started", handleTimerStarted);
      socket.off("timer-update", handleTimerUpdate);
      socket.off("timer-paused", handleTimerPaused);
      socket.off("timer-stop", handleTimerStopped);
      socket.off("timer-completed", handleTimerCompleted);
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
    };
  }, [
    socket,
    createPeerConnection,
    currentUserId,
    isAudioEnabled,
    sendOffer,
  ]);

  const handleTimerAction = useCallback(
    (action: "start" | "pause" | "stop", type?: TimerState["type"]) => {
      if (!socket || !roomId) return;

      setIsTimerBusy(true);

      const callback = (response: any) => {
        setIsTimerBusy(false);
        if (!response?.success) {
          toast.error(response?.error ?? "Timer action failed.");
        }
      };

      if (action === "start") {
        socket.emit("start-timer", { type: type ?? "work" }, callback);
      } else if (action === "pause") {
        socket.emit("pause-timer", callback);
      } else {
        socket.emit("stop-timer", callback);
      }
    },
    [roomId, socket]
  );

  const handleToggleMute = useCallback(() => {
    if (!socket) return;

    const me = room?.participants.find(
      (participant) => participant.id === currentUserId
    );

    const nextMute = !(me?.is_muted ?? false);

    socket.emit("toggle-mute", { isMuted: nextMute }, (response: any) => {
      if (!response?.success) {
        toast.error(response?.error ?? "Unable to update mute state.");
      }
    });
  }, [currentUserId, room?.participants, socket]);

  const handleLeave = useCallback(() => {
    if (socket) {
      socket.emit("leave-room");
    }
    cleanupConnections();
    router.push("/rooms");
  }, [cleanupConnections, router, socket]);

  if (!roomId) {
    return (
      <div className="container mx-auto max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Room Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The room you are looking for could not be located.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/rooms">Back to Rooms</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasSession && !isConnecting) {
    return (
      <div className="container mx-auto max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Sign in to join or manage this study room.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/rooms">Back to Rooms</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl p-6">
        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading room...
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container mx-auto max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Room Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This room is no longer active.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/rooms">Back to Rooms</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timeRemaining =
    room.timer.time_remaining ?? room.timer.duration ?? 25 * 60;
  const isHost = currentUserId === room.host_id;
  const myParticipant = room.participants.find(
    (participant) => participant.id === currentUserId
  );

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{room.name}</h1>
          <p className="mt-2 text-muted-foreground">{room.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">Code: {room.room_code}</Badge>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {room.participants.length}/{room.max_participants} participants
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Host: {room.host_id === currentUserId ? "You" : "Host"}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleLeave}>
            <XCircle className="mr-2 h-4 w-4" />
            Leave Room
          </Button>
        </div>
      </div>

      {joinError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {joinError}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-primary" />
              Pomodoro Timer
            </CardTitle>
            <CardDescription>
              {room.timer.is_active
                ? `Session ${room.timer.session_count}`
                : "Waiting to start"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-muted/50 p-6">
              <span className="text-sm font-medium uppercase text-muted-foreground">
                {TIMER_LABELS[room.timer.type]}
              </span>
              <span className="text-5xl font-semibold tracking-tight">
                {formatSeconds(timeRemaining)}
              </span>
              <span className="text-xs text-muted-foreground">
                {room.timer.is_active ? "Counting down..." : "Paused"}
              </span>
            </div>

            {isHost ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={isTimerBusy}
                    onClick={() => handleTimerAction("start", "work")}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Work
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={isTimerBusy}
                    onClick={() => handleTimerAction("start", "break")}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Break
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={isTimerBusy}
                    onClick={() => handleTimerAction("start", "long_break")}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Long Break
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    disabled={isTimerBusy}
                    onClick={() => handleTimerAction("pause")}
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={isTimerBusy}
                    onClick={() => handleTimerAction("stop")}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Only the host can control the timer. Stay focused and follow
                along!
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voice Chat</CardTitle>
            <CardDescription>
              Enable your microphone to join the study room audio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <audio ref={localAudioRef} autoPlay muted className="hidden" />

            <div className="flex items-center gap-2">
              <Button
                onClick={isAudioEnabled ? disableAudio : enableAudio}
                variant={isAudioEnabled ? "destructive" : "default"}
                className="flex-1"
              >
                {isAudioEnabled ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4" />
                    Disable Microphone
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Enable Microphone
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleToggleMute}
                disabled={!myParticipant}
                title="Toggle mute status for this room"
              >
                {myParticipant?.is_muted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>

            {remoteStreams.length > 0 && (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Connected participants:</p>
                <div className="flex flex-wrap gap-2">
                  {remoteStreams.map((item) => (
                    <Badge key={item.userId} variant="secondary">
                      {item.userId.slice(0, 6)}…
                    </Badge>
                  ))}
                </div>
                {remoteStreams.map((item) => (
                  <RemoteAudio key={item.userId} stream={item.stream} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Participants</CardTitle>
          <CardDescription>
            Track who is currently studying with you in this room.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {room.participants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No participants in the room.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {room.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                >
                  <div>
                    <p className="font-medium">
                      {participant.id === currentUserId
                        ? "You"
                        : participant.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {participant.is_host ? "Host" : "Participant"}
                    </p>
                  </div>
                  <Badge
                    variant={participant.is_muted ? "outline" : "secondary"}
                    className="flex items-center gap-1"
                  >
                    {participant.is_muted ? (
                      <VolumeX className="h-3 w-3" />
                    ) : (
                      <Volume2 className="h-3 w-3" />
                    )}
                    {participant.is_muted ? "Muted" : "Live"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
