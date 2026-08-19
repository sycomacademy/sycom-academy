import { m, type Variants } from "motion/react";

import {
  getVariants,
  IconWrapper,
  useAnimateIconContext,
  type IconProps,
} from "@sycom-learn/ui/components/animated/icons/icon";

type KeyboardShortcutsProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    frame: {},
    key1: {
      initial: { y: 0 },
      animate: { y: [0, 1.2, 0], transition: { duration: 0.35, ease: "easeInOut" } },
    },
    key2: {
      initial: { y: 0 },
      animate: { y: [0, 1.2, 0], transition: { duration: 0.35, ease: "easeInOut", delay: 0.06 } },
    },
    key3: {
      initial: { y: 0 },
      animate: { y: [0, 1.2, 0], transition: { duration: 0.35, ease: "easeInOut", delay: 0.12 } },
    },
    bar: {
      initial: { scaleX: 1 },
      animate: { scaleX: [1, 0.92, 1], transition: { duration: 0.35, ease: "easeInOut" } },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: KeyboardShortcutsProps) {
  const { controls } = useAnimateIconContext();
  const variants = getVariants(animations);

  return (
    <m.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <m.rect
        x={3}
        y={5}
        width={18}
        height={14}
        rx={2}
        variants={variants.frame}
        initial="initial"
        animate={controls}
      />
      <m.rect
        x={7}
        y={9}
        width={2}
        height={2}
        rx={0.5}
        variants={variants.key1}
        initial="initial"
        animate={controls}
      />
      <m.rect
        x={11}
        y={9}
        width={2}
        height={2}
        rx={0.5}
        variants={variants.key2}
        initial="initial"
        animate={controls}
      />
      <m.rect
        x={15}
        y={9}
        width={2}
        height={2}
        rx={0.5}
        variants={variants.key3}
        initial="initial"
        animate={controls}
      />
      <m.path
        d="M7 15h10"
        variants={variants.bar}
        initial="initial"
        animate={controls}
        style={{ originX: "50%", originY: "50%", transformBox: "fill-box" }}
      />
    </m.svg>
  );
}

function KeyboardShortcuts(props: KeyboardShortcutsProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  KeyboardShortcuts,
  KeyboardShortcuts as KeyboardShortcutsIcon,
  type KeyboardShortcutsProps,
  type KeyboardShortcutsProps as KeyboardShortcutsIconProps,
};
