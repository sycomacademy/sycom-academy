import { m, type Variants } from "motion/react";

import {
  getVariants,
  IconWrapper,
  useAnimateIconContext,
  type IconProps,
} from "@sycom-learn/ui/components/animated/icons/icon";

type UserProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    circle: {
      initial: { y: 0 },
      animate: { y: [-0.8, 0.3, 0], transition: { duration: 0.4, ease: "easeInOut" } },
    },
    path: {
      initial: { scaleX: 1 },
      animate: { scaleX: [1, 1.05, 1], transition: { duration: 0.4, ease: "easeInOut" } },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: UserProps) {
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
        d="M19 21a7 7 0 0 0-14 0"
        variants={variants.path}
        initial="initial"
        animate={controls}
        style={{ originX: "50%", originY: "100%", transformBox: "fill-box" }}
      />
      <m.circle
        cx={12}
        cy={8}
        r={4}
        variants={variants.circle}
        initial="initial"
        animate={controls}
      />
    </m.svg>
  );
}

function User(props: UserProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { animations, User, User as UserIcon, type UserProps, type UserProps as UserIconProps };
