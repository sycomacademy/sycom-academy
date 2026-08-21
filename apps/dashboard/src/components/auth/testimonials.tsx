import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const testimonials = [
  {
    name: "Alex Rivera",
    title: "Security Analyst, TechShield Inc.",
    firstPart: "Sycom completely changed how I approach certifications",
    secondPart:
      ". The hands-on labs made concepts click in ways that reading textbooks never could. I passed my CompTIA Security+ on the first try.",
  },
  {
    name: "Priya Sharma",
    title: "IT Manager, CloudFirst Solutions",
    firstPart:
      "Our team's incident response time dropped by 40% after going through Sycom's training",
    secondPart:
      ". The real-world scenarios prepare you for exactly what you'll face in production environments.",
  },
  {
    name: "Marcus Johnson",
    title: "Penetration Tester, RedLine Security",
    firstPart: "I went from help desk to pentesting in under a year thanks to Sycom",
    secondPart:
      ". The structured learning path and lab environments gave me the practical skills employers actually look for.",
  },
  {
    name: "Elena Vasquez",
    title: "CISO, Meridian Health",
    firstPart: "We use Sycom to onboard every new security hire",
    secondPart:
      ". It gets them up to speed faster than any other platform we've tried, and the progress tracking gives me full visibility into their growth.",
  },
];

export function LoginTestimonials() {
  const [current, setCurrent] = useState(() => Math.floor(Math.random() * testimonials.length));
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  const testimonial = testimonials[current];

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative flex h-64 items-center justify-center">
        <AnimatePresence mode="wait">
          <m.div
            animate={{ opacity: 1 }}
            className="space-y-4 text-center"
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            key={current}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
          >
            <m.div
              animate={
                shouldReduceMotion ? { opacity: 1 } : { opacity: 1, filter: "blur(0px)", y: 0 }
              }
              className="relative mx-auto max-w-lg"
              initial={shouldReduceMotion ? false : { opacity: 0, filter: "blur(2px)", y: 10 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.6, delay: 0.1, ease: "easeOut" }
              }
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02]">
                <svg
                  aria-hidden="true"
                  className="size-55 object-contain"
                  fill="none"
                  height="220"
                  viewBox="0 0 6 5"
                  width="220"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.55 4.83C4.16 4.83 3.84 4.68 3.59 4.4C3.35 4.11 3.23 3.71 3.23 3.21C3.23 2.64 3.41 2.1 3.77 1.59C4.13 1.07 4.69 0.62 5.45 0.22L5.77 0.67C5.12 1.05 4.69 1.44 4.47 1.82C4.26 2.21 4.15 2.63 4.15 3.08L3.68 3.82C3.68 3.52 3.77 3.28 3.95 3.1C4.14 2.91 4.38 2.81 4.67 2.81C4.95 2.81 5.18 2.9 5.37 3.08C5.57 3.26 5.66 3.5 5.66 3.8C5.66 4.09 5.56 4.34 5.36 4.54C5.15 4.73 4.88 4.83 4.55 4.83ZM1.5 4.83C1.12 4.83 0.8 4.68 0.55 4.4C0.31 4.11 0.19 3.71 0.19 3.21C0.19 2.64 0.37 2.1 0.73 1.59C1.09 1.07 1.65 0.62 2.4 0.22L2.73 0.67C2.08 1.05 1.65 1.44 1.43 1.82C1.22 2.21 1.11 2.63 1.11 3.08L0.64 3.82C0.64 3.52 0.73 3.28 0.91 3.1C1.1 2.91 1.34 2.81 1.63 2.81C1.91 2.81 2.14 2.9 2.33 3.08C2.52 3.26 2.62 3.5 2.62 3.8C2.62 4.09 2.52 4.34 2.31 4.54C2.11 4.73 1.84 4.83 1.5 4.83Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <p className="pl-4 font-sans text-2xl/relaxed font-semibold text-background/80">
                <span className="text-background">&ldquo;{testimonial?.firstPart}</span>
                {testimonial?.secondPart.startsWith(".")
                  ? testimonial.secondPart
                  : ` ${testimonial?.secondPart}`}
                &rdquo;
              </p>
            </m.div>

            <m.p
              animate={
                shouldReduceMotion ? { opacity: 1 } : { opacity: 1, filter: "blur(0px)", y: 0 }
              }
              className="font-sans text-xs text-background"
              initial={shouldReduceMotion ? false : { opacity: 0, filter: "blur(2px)", y: 10 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.6, delay: 0.3, ease: "easeOut" }
              }
            >
              {testimonial?.name}, {testimonial?.title}
            </m.p>
          </m.div>
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}
