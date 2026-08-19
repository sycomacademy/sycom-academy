import { m, type Variants } from "motion/react";

import {
  getVariants,
  IconWrapper,
  useAnimateIconContext,
  type IconProps,
} from "@sycom-learn/ui/components/animated/icons/icon";

type LogOutProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    path1: {},
    path2: {
      initial: { x: 0 },
      animate: { x: [0, 2.2, 0], transition: { duration: 0.4, ease: "easeInOut" } },
    },
    path3: {
      initial: { x: 0 },
      animate: { x: [0, 2.2, 0], transition: { duration: 0.4, ease: "easeInOut" } },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: LogOutProps) {
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
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <m.path d="m16 17 5-5-5-5" variants={variants.path2} initial="initial" animate={controls} />
      <m.path d="M21 12H9" variants={variants.path3} initial="initial" animate={controls} />
    </m.svg>
  );
}

function LogOut(props: LogOutProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  LogOut,
  LogOut as LogOutIcon,
  type LogOutProps,
  type LogOutProps as LogOutIconProps,
};
