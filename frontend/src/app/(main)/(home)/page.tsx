import { Button } from "@/components/ui/button";
import Link from "next/link";
import BentoGridSection from "./_components/bento-grid-section";

const HomePage = () => {
  return (
    <div>
      <section className="grid place-content-center place-items-center gap-6 text-center">
        <span className="mt-10 pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300/80 bg-clip-text text-center text-9xl font-bold leading-none text-transparent dark:from-white dark:to-slate-700 pb-3">
          Pomly
        </span>
        <p className="max-w-3xl text-xl">
        Join synchronized study rooms with voice chat and Pomodoro timers. Stay motivated with fellow learners in real-time audio study sessions!
        </p>

        <div className="flex items-center gap-3">
          <Button className="rounded-full">
            <Link href="/login">Get Started</Link>
          </Button>

          <Button variant="outline" className="rounded-full">
            <a href="https://github.com/AlNaheyan/pomly" target="_blank">
              GitHub
            </a>
          </Button>
        </div>
      </section>

      <section className="space-y-12">
        <h2 className="text-center">Key Features</h2>

        <BentoGridSection />
      </section>

      <section className="space-y-6 text-center">
        <h2>Completely Open Source</h2>

        <p className="mx-auto max-w-2xl">
          The code for this project is completely open source and available on
          GitHub. Join the community and contribute to the future of web
          development!
        </p>

        <Button size="sm" asChild>
          <a
            href="https://github.com/SarathAdhi/next-supabase-auth"
            target="_blank"
          >
            View on GitHub
          </a>
        </Button>
      </section>
    </div>
  );
};

export default HomePage;
