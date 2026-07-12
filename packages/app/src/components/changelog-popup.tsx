import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "ui";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { releaseQuery } from "../data/getReleases/query";

const DISMISSED_KEY = "trek-cli-changelog-dismissed";

export function ChangelogPopup() {
  const appVersion = window.__TREK_CLI__?.App?.version;

  const { data: release } = useQuery(releaseQuery());

  const [dismissed, setDismissed] = useState(() =>
    appVersion ? localStorage.getItem(DISMISSED_KEY) === appVersion : true,
  );

  const open = !!release && !dismissed;

  function handleDismiss() {
    if (appVersion) localStorage.setItem(DISMISSED_KEY, appVersion);
    setDismissed(true);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDismiss} />
      <div className="relative flex w-full max-w-2xl max-h-[80vh] flex-col overflow-hidden rounded-2xl border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">What's New in v{appVersion}</h2>
          <button
            onClick={handleDismiss}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="Close"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="overflow-auto p-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown remarkPlugins={[remarkGfm]}>{release.body}</Markdown>
          </div>
        </div>
        <div className="flex items-center justify-between border-t px-6 py-4">
          <a
            href={release.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            View full release on GitHub
          </a>
          <Button onClick={handleDismiss}>Got it</Button>
        </div>
      </div>
    </div>
  );
}
