import { m, type Variants } from "motion/react";

import {
  getVariants,
  IconWrapper,
  useAnimateIconContext,
  type IconProps,
} from "@sycom-learn/ui/components/animated/icons/icon";

type ThemeToggleProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    group: {
      initial: { rotate: 0, transition: { duration: 0.35, ease: "easeInOut" } },
      animate: { rotate: 180, transition: { duration: 0.35, ease: "easeInOut" } },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: ThemeToggleProps) {
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
      <m.g
        variants={variants.group}
        initial="initial"
        animate={controls}
        style={{ originX: "50%", originY: "50%", transformBox: "fill-box" }}
      >
        <m.circle
          cx={12}
          cy={12}
          r={9}
          variants={variants.circle}
          initial="initial"
          animate={controls}
        />
        <m.path d="M12 3v18" variants={variants.path1} initial="initial" animate={controls} />
        <m.path
          d="M12 9l4.65-4.65"
          variants={variants.path2}
          initial="initial"
          animate={controls}
        />
        <m.path
          d="M12 14.3l7.37-7.37"
          variants={variants.path3}
          initial="initial"
          animate={controls}
        />
        <m.path
          d="M12 19.6l8.85-8.85"
          variants={variants.path4}
          initial="initial"
          animate={controls}
        />
      </m.g>
    </m.svg>
  );
}

function ThemeToggle(props: ThemeToggleProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  ThemeToggle,
  ThemeToggle as ThemeToggleIcon,
  type ThemeToggleProps,
  type ThemeToggleProps as ThemeToggleIconProps,
};
