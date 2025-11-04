export type RoomParticipant = {
  id: string;
  is_host: boolean;
  is_muted: boolean;
};

export type TimerState = {
  is_active: boolean;
  type: "work" | "break" | "long_break";
  duration: number;
  time_remaining?: number;
  session_count: number;
  started_at: string | null;
};

export type RoomSummary = {
  id: string;
  room_code: string;
  name: string;
  description: string;
  participants: number;
  max_participants: number;
  is_timer_active: boolean;
  host_name: string;
};

export type RoomDetail = {
  id: string;
  room_code: string;
  name: string;
  description: string;
  host_id: string;
  max_participants: number;
  created_at: string;
  is_active: boolean;
  participants: RoomParticipant[];
  timer: TimerState;
};
