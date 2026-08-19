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

export type AudioPlayerProps = ComponentProps<typeof MediaController>;

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

export const AudioPlayer = ({ style, ...props }: AudioPlayerProps) => (
  <MediaController
    audio
    style={{
      ...variables,
      ...style,
    }}
    {...props}
  />
);

export type AudioPlayerControlBarProps = ComponentProps<typeof MediaControlBar>;

export const AudioPlayerControlBar = (props: AudioPlayerControlBarProps) => (
  <MediaControlBar {...props} />
);

export type AudioPlayerTimeRangeProps = ComponentProps<typeof MediaTimeRange>;

export const AudioPlayerTimeRange = ({ className, ...props }: AudioPlayerTimeRangeProps) => (
  <MediaTimeRange className={cn(rangeClassName, className)} {...props} />
);

export type AudioPlayerTimeDisplayProps = ComponentProps<typeof MediaTimeDisplay>;

export const AudioPlayerTimeDisplay = ({ className, ...props }: AudioPlayerTimeDisplayProps) => (
  <MediaTimeDisplay className={cn(timeDisplayClassName, className)} {...props} />
);

export type AudioPlayerVolumeRangeProps = ComponentProps<typeof MediaVolumeRange>;

export const AudioPlayerVolumeRange = ({ className, ...props }: AudioPlayerVolumeRangeProps) => (
  <MediaVolumeRange className={cn(rangeClassName, className)} {...props} />
);

export type AudioPlayerPlayButtonProps = ComponentProps<typeof MediaPlayButton>;

export const AudioPlayerPlayButton = ({ className, ...props }: AudioPlayerPlayButtonProps) => (
  <MediaPlayButton className={cn(controlButtonClassName, className)} {...props} />
);

export type AudioPlayerSeekBackwardButtonProps = ComponentProps<typeof MediaSeekBackwardButton>;

export const AudioPlayerSeekBackwardButton = ({
  className,
  ...props
}: AudioPlayerSeekBackwardButtonProps) => (
  <MediaSeekBackwardButton className={cn(controlButtonClassName, className)} {...props} />
);

export type AudioPlayerSeekForwardButtonProps = ComponentProps<typeof MediaSeekForwardButton>;

export const AudioPlayerSeekForwardButton = ({
  className,
  ...props
}: AudioPlayerSeekForwardButtonProps) => (
  <MediaSeekForwardButton className={cn(controlButtonClassName, className)} {...props} />
);

export type AudioPlayerMuteButtonProps = ComponentProps<typeof MediaMuteButton>;

export const AudioPlayerMuteButton = ({ className, ...props }: AudioPlayerMuteButtonProps) => (
  <MediaMuteButton className={cn(controlButtonClassName, className)} {...props} />
);

export type AudioPlayerContentProps = ComponentProps<"audio">;

export const AudioPlayerContent = ({ className, ...props }: AudioPlayerContentProps) => (
  <audio slot="media" className={cn("mt-0 mb-0 w-full", className)} {...props}>
    <track kind="captions" srcLang="en" label="Captions" />
  </audio>
);
