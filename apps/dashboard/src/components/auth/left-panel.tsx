import { Image } from "@sycom-learn/ui/image";
import { Link } from "@tanstack/react-router";

import { FlickeringGrid } from "./flickering-grid";
import { LoginTestimonials } from "./testimonials";

export function AuthLeftPanel() {
  return (
    <>
      <FlickeringGrid
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-primary/70 dark:bg-primary"
        color="rgb(254, 243, 199)"
        flickerChance={0.1}
        gridGap={12}
        maxOpacity={0.12}
        squareSize={24}
      />

      <Link
        aria-label="Sycom Solutions home"
        className="absolute top-6 left-6 z-20 flex items-center transition-opacity hover:opacity-80"
        to="/"
      >
        <div className="flex size-20 items-center justify-center overflow-hidden rounded">
          <Image
            alt=""
            height={80}
            layout="fixed"
            loading="eager"
            src="/logos/sycom-logo-icon.png"
            width={80}
          />
        </div>
      </Link>

      <div className="relative z-10 flex h-full w-full items-center justify-center p-8">
        <div className="max-w-lg min-w-0">
          <LoginTestimonials />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-linear-to-b from-black to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-linear-to-t from-black to-transparent" />
    </>
  );
}
