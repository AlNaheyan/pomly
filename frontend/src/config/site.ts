type SiteConfig = {
  name: string;
  description: string;
  url: string;
  links: {
    github: string;
  };
};

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

export const siteConfig: SiteConfig = {
  name: "Pomly",
  description:
    "Open Source Audio calling study platform for groups or solo using Pomodoro Technique!",
  url: baseUrl,
  links: {
    github: "https://github.com/AlNaheyan",
  },
};
