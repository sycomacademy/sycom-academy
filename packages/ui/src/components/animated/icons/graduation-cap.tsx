import { m, type Variants } from "motion/react";

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from "@sycom-learn/ui/components/animated/icons/icon";

type GraduationCapProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    cap: {
      initial: { rotate: 0, y: 0 },
      animate: {
        rotate: [0, -10, 4, 0],
        y: [0, -1.5, 0, 0],
        transition: { duration: 0.6, ease: "easeInOut" },
      },
    },
    tassel: {
      initial: { rotate: 0 },
      animate: {
        rotate: [0, 14, -6, 0],
        transition: { duration: 0.7, ease: "easeInOut", delay: 0.05 },
      },
    },
    brim: {},
  } satisfies Record<string, Variants>,
  toss: {
    cap: {
      initial: { y: 0, rotate: 0 },
      animate: {
        y: [0, -4, 0],
        rotate: [0, -16, 0],
        transition: { duration: 0.7, ease: "easeOut" },
      },
    },
    tassel: {
      initial: { rotate: 0 },
      animate: {
        rotate: [0, 24, 0],
        transition: { duration: 0.7, ease: "easeOut", delay: 0.05 },
      },
    },
    brim: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: GraduationCapProps) {
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
      <m.path
        d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"
        variants={variants.cap}
        initial="initial"
        animate={controls}
        style={{ originX: "50%", originY: "100%", transformBox: "fill-box" }}
      />
      <m.path
        d="M22 10v6"
        variants={variants.tassel}
        initial="initial"
        animate={controls}
        style={{ originX: "50%", originY: "0%", transformBox: "fill-box" }}
      />
      <m.path
        d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"
        variants={variants.brim}
        initial="initial"
        animate={controls}
      />
    </m.svg>
  );
}

function GraduationCap(props: GraduationCapProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  GraduationCap,
  GraduationCap as GraduationCapIcon,
  type GraduationCapProps,
  type GraduationCapProps as GraduationCapIconProps,
};
