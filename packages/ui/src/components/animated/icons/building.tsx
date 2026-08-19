import { m, type Variants } from "motion/react";

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from "@sycom-learn/ui/components/animated/icons/icon";

type BuildingProps = IconProps<keyof typeof animations>;

const windowPulse = (delay: number): Variants => ({
  initial: { opacity: 1 },
  animate: {
    opacity: [1, 0.2, 1],
    transition: {
      duration: 0.9,
      ease: "easeInOut",
      delay,
    },
  },
});

const animations = {
  default: {
    rect: {},
    door: {
      initial: { scaleY: 1 },
      animate: {
        scaleY: [1, 0.85, 1],
        transition: { duration: 0.5, ease: "easeInOut", delay: 0.45 },
      },
    },
    windowBL: windowPulse(0),
    windowBC: windowPulse(0.05),
    windowBR: windowPulse(0.1),
    windowML: windowPulse(0.15),
    windowMC: windowPulse(0.2),
    windowMR: windowPulse(0.25),
    windowTL: windowPulse(0.3),
    windowTC: windowPulse(0.35),
    windowTR: windowPulse(0.4),
  } satisfies Record<string, Variants>,
  appear: {
    rect: {
      initial: { pathLength: 0, opacity: 0 },
      animate: {
        pathLength: 1,
        opacity: 1,
        transition: { duration: 0.5, ease: "easeInOut" },
      },
    },
    door: {
      initial: { opacity: 0, y: 2 },
      animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: "easeOut", delay: 0.55 },
      },
    },
    windowBL: { initial: { opacity: 0 }, animate: { opacity: 1, transition: { delay: 0.5 } } },
    windowBC: { initial: { opacity: 0 }, animate: { opacity: 1, transition: { delay: 0.55 } } },
    windowBR: { initial: { opacity: 0 }, animate: { opacity: 1, transition: { delay: 0.6 } } },
    windowML: { initial: { opacity: 0 }, animate: { opacity: 1, transition: { delay: 0.4 } } },
    windowMC: { initial: { opacity: 0 }, animate: { opacity: 1, transition: { delay: 0.45 } } },
    windowMR: { initial: { opacity: 0 }, animate: { opacity: 1, transition: { delay: 0.5 } } },
    windowTL: { initial: { opacity: 0 }, animate: { opacity: 1, transition: { delay: 0.3 } } },
    windowTC: { initial: { opacity: 0 }, animate: { opacity: 1, transition: { delay: 0.35 } } },
    windowTR: { initial: { opacity: 0 }, animate: { opacity: 1, transition: { delay: 0.4 } } },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: BuildingProps) {
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
        x={4}
        y={2}
        width={16}
        height={20}
        rx={2}
        variants={variants.rect}
        initial="initial"
        animate={controls}
      />
      <m.path d="M8 6h.01" variants={variants.windowTL} initial="initial" animate={controls} />
      <m.path d="M12 6h.01" variants={variants.windowTC} initial="initial" animate={controls} />
      <m.path d="M16 6h.01" variants={variants.windowTR} initial="initial" animate={controls} />
      <m.path d="M8 10h.01" variants={variants.windowML} initial="initial" animate={controls} />
      <m.path d="M12 10h.01" variants={variants.windowMC} initial="initial" animate={controls} />
      <m.path d="M16 10h.01" variants={variants.windowMR} initial="initial" animate={controls} />
      <m.path d="M8 14h.01" variants={variants.windowBL} initial="initial" animate={controls} />
      <m.path d="M12 14h.01" variants={variants.windowBC} initial="initial" animate={controls} />
      <m.path d="M16 14h.01" variants={variants.windowBR} initial="initial" animate={controls} />
      <m.path
        d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"
        variants={variants.door}
        initial="initial"
        animate={controls}
        style={{ originX: "50%", originY: "100%", transformBox: "fill-box" }}
      />
    </m.svg>
  );
}

function Building(props: BuildingProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Building,
  Building as BuildingIcon,
  type BuildingProps,
  type BuildingProps as BuildingIconProps,
};
