import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { LockKeyhole, Timer, Headset, Component } from "lucide-react";

const features = [
  {
    Icon: LockKeyhole,
    name: "Authentication System",
    description:
      "Secure login and registration using JWT, bcrypt, and Supabase. Set up protected routes and manage user sessions.",
    href: "https://supabase.com/docs/guides/auth/jwts",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-1",
    background: <div />,
  },
  {
    Icon: Headset,
    name: "Real-Time Study Rooms",
    description:
      "Create or join virtual rooms using a 5-digit code. Rooms support up to 10 participants with audio and timer sync.",
    href: "#",
    cta: "Learn more",
    className: "col-span-2 lg:col-span-2",
    background: <div />,
  },
  {
    Icon: Timer,
    name: "Synced Pomodoro Timer",
    description:
      "Host-controlled Pomodoro sessions broadcast in real-time with automatic transitions and session persistence.",
    href: "https://en.wikipedia.org/wiki/Pomodoro_Technique",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2",
    background: <div />,
  },
  {
    Icon: Component,
    name: "Advanced Features",
    description:
      "Push notifications, avatars, room invites, session history, and customizable Pomodoro templates for future growth.",
    className: "col-span-3 lg:col-span-1",
    href: "#",
    cta: "Learn more",
    background: <div />,
  },
];

const BentoGridSection = () => {
  return (
    <BentoGrid>
      {features.map((feature, idx) => (
        <BentoCard key={idx} {...feature} />
      ))}
    </BentoGrid>
  );
};

export default BentoGridSection;
