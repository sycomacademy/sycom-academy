import {
  MediaControlBar,
  MediaController,
  MediaMuteButton,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaTimeDisplay,
  MediaTimeRange,
  MediaVolumeRange,
} from "media-chrome/react";
import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@sycom-learn/ui/lib/utils";

export type VideoPlayerProps = ComponentProps<typeof MediaController>;

const variables = {
  "--media-primary-color": "var(--primary)",
  "--media-secondary-color": "var(--background)",
  "--media-text-color": "var(--foreground)",
  "--media-background-color": "var(--background)",
  "--media-control-hover-background": "var(--accent)",
  "--media-font-family": "var(--font-sans)",
  "--media-live-button-icon-color": "var(--muted-foreground)",
  "--media-live-button-indicator-color": "var(--destructive)",
  "--media-range-track-background": "var(--border)",
} as CSSProperties;

const controlButtonClassName =
  "p-2.5 [--media-icon-color:var(--foreground)] hover:[--media-icon-color:var(--accent-foreground)]";

const timeDisplayClassName =
  "p-2.5 [--media-text-color:var(--foreground)] hover:[--media-text-color:var(--accent-foreground)]";

const rangeClassName = cn(
  "p-2.5",
  "[--media-range-bar-color:var(--foreground)]",
  "[--media-range-thumb-background:var(--foreground)]",
  "[--media-range-track-background:var(--border)]",
  "hover:[--media-range-bar-color:var(--accent-foreground)]",
  "hover:[--media-range-thumb-background:var(--accent-foreground)]",
  "hover:[--media-range-track-background:color-mix(in oklab,var(--accent-foreground)_20%,transparent)]",
);

export const VideoPlayer = ({ style, ...props }: VideoPlayerProps) => (
  <MediaController
    style={{
      ...variables,
      ...style,
    }}
    {...props}
  />
);

export type VideoPlayerControlBarProps = ComponentProps<typeof MediaControlBar>;

export const VideoPlayerControlBar = (props: VideoPlayerControlBarProps) => (
  <MediaControlBar {...props} />
);

export type VideoPlayerTimeRangeProps = ComponentProps<typeof MediaTimeRange>;

export const VideoPlayerTimeRange = ({ className, ...props }: VideoPlayerTimeRangeProps) => (
  <MediaTimeRange className={cn(rangeClassName, className)} {...props} />
);

export type VideoPlayerTimeDisplayProps = ComponentProps<typeof MediaTimeDisplay>;

export const VideoPlayerTimeDisplay = ({ className, ...props }: VideoPlayerTimeDisplayProps) => (
  <MediaTimeDisplay className={cn(timeDisplayClassName, className)} {...props} />
);

export type VideoPlayerVolumeRangeProps = ComponentProps<typeof MediaVolumeRange>;

export const VideoPlayerVolumeRange = ({ className, ...props }: VideoPlayerVolumeRangeProps) => (
  <MediaVolumeRange className={cn(rangeClassName, className)} {...props} />
);

export type VideoPlayerPlayButtonProps = ComponentProps<typeof MediaPlayButton>;

export const VideoPlayerPlayButton = ({ className, ...props }: VideoPlayerPlayButtonProps) => (
  <MediaPlayButton className={cn(controlButtonClassName, className)} {...props} />
);

export type VideoPlayerSeekBackwardButtonProps = ComponentProps<typeof MediaSeekBackwardButton>;

export const VideoPlayerSeekBackwardButton = ({
  className,
  ...props
}: VideoPlayerSeekBackwardButtonProps) => (
  <MediaSeekBackwardButton className={cn(controlButtonClassName, className)} {...props} />
);

export type VideoPlayerSeekForwardButtonProps = ComponentProps<typeof MediaSeekForwardButton>;

export const VideoPlayerSeekForwardButton = ({
  className,
  ...props
}: VideoPlayerSeekForwardButtonProps) => (
  <MediaSeekForwardButton className={cn(controlButtonClassName, className)} {...props} />
);

export type VideoPlayerMuteButtonProps = ComponentProps<typeof MediaMuteButton>;

export const VideoPlayerMuteButton = ({ className, ...props }: VideoPlayerMuteButtonProps) => (
  <MediaMuteButton className={cn(controlButtonClassName, className)} {...props} />
);

export type VideoPlayerContentProps = ComponentProps<"video">;

export const VideoPlayerContent = ({ className, ...props }: VideoPlayerContentProps) => (
  <video slot="media" className={cn("mt-0 mb-0", className)} {...props}>
    <track kind="captions" srcLang="en" label="Captions" />
  </video>
);
