import { useId } from "react";
import { m, type Variants } from "motion/react";

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from "@sycom-learn/ui/components/animated/icons/icon";

type ConstructionProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    pattern: {
      initial: {
        x: 0,
      },
      animate: {
        x: [0, 6],
        transition: {
          duration: 1,
          ease: "linear",
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
        },
      },
    },
    rect: {},
    path1: {},
    path2: {},
    path3: {},
    path4: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: ConstructionProps) {
  const { controls } = useAnimateIconContext();
  const variants = getVariants(animations);
  const patternId = useId();

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
      <defs>
        <m.pattern
          id={patternId}
          patternUnits="userSpaceOnUse"
          width="6"
          height="14"
          variants={variants.pattern}
          initial="initial"
          animate={controls}
        >
          <path d="M-4 -2 L14 30" stroke="currentColor" strokeWidth={2} />
        </m.pattern>
      </defs>
      <m.rect
        x={2}
        y={6}
        width={20}
        height={8}
        rx={1}
        fill={`url(#${patternId})`}
        variants={variants.rect}
        initial="initial"
        animate={controls}
      />
      <m.path d="M17 14v7" variants={variants.path1} initial="initial" animate={controls} />
      <m.path d="M7 14v7" variants={variants.path2} initial="initial" animate={controls} />
      <m.path d="M17 3v3" variants={variants.path3} initial="initial" animate={controls} />
      <m.path d="M7 3v3" variants={variants.path4} initial="initial" animate={controls} />
    </m.svg>
  );
}

function Construction(props: ConstructionProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Construction,
  Construction as ConstructionIcon,
  type ConstructionProps,
  type ConstructionProps as ConstructionIconProps,
};
