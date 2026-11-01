import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/index")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
  head: () => ({
    meta: [
      { title: "Cleaning Calendar — Open calendar" },
      { name: "description", content: "Open your apartment cleaning calendar." },
      { property: "og:title", content: "Cleaning Calendar — Open calendar" },
      { property: "og:description", content: "Open your apartment cleaning calendar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
});