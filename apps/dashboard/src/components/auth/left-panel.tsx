import { Link } from "@tanstack/react-router";

import { FlickeringGrid } from "./flickering-grid";

// The marketing testimonials from the main app are not ported yet — this is the
// same treatment (grid + top/bottom fades) with a plain wordmark in their place.
export function AuthLeftPanel() {
  return (
    <>
      <FlickeringGrid
        className="absolute inset-0 z-0 bg-primary/70 dark:bg-primary"
        color="rgb(254, 243, 199)"
        flickerChance={0.1}
        gridGap={12}
        maxOpacity={0.12}
        squareSize={24}
      />

      <Link
        className="absolute top-6 left-6 z-20 flex items-center gap-2 transition-opacity hover:opacity-80"
        to="/"
      >
        <span className="flex size-12 items-center justify-center rounded bg-white/10 text-lg font-semibold text-white">
          S
        </span>
      </Link>

      <div className="relative z-10 flex h-full w-full items-center justify-center p-8">
        <div className="max-w-lg space-y-4">
          <p className="text-3xl leading-tight font-medium text-white">
            Everything your team learns, in one place.
          </p>
          <p className="text-sm text-white/70">Sycom Solutions</p>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32"
        style={{ background: "linear-gradient(to bottom, black, transparent)" }}
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32"
        style={{ background: "linear-gradient(to top, black, transparent)" }}
      />
    </>
  );
}
