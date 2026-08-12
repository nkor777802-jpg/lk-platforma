import { useEffect, useState } from "react";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export function TypewriterText({
  text,
  delay = 0,
  speed = 30,
}: {
  text: string;
  delay?: number;
  speed?: number;
}) {
  const [displayed, setDisplayed] = useState(text);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setDisplayed(text);
      return;
    }
    setDisplayed(text);
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      setDisplayed("");
      let i = 0;
      interval = setInterval(() => {
        i += 1;
        setDisplayed(text.slice(0, i));
        if (i >= text.length && interval) clearInterval(interval);
      }, speed);
    }, delay);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [text, delay, speed, reducedMotion]);

  return <span>{displayed}</span>;
}

export function AnimatedStageList({
  items,
}: {
  items: readonly { title: string; text: string }[];
}) {
  let elapsed = 0;
  return (
    <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((s, i) => {
        const cardDelay = elapsed;
        const titleDelay = cardDelay + 300;
        const textDelay = titleDelay + s.title.length * 30 + 200;
        elapsed = textDelay + s.text.length * 12 + 250;
        return (
          <li
            key={s.title}
            className="animate-fade-in rounded-lg border border-border bg-card p-6 transition-colors hover:border-secondary"
            style={{ animationDelay: `${cardDelay}ms`, animationFillMode: "both" }}
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {i + 1}
            </span>
            <h3 className="mt-4 min-h-[1.5rem] text-base font-semibold text-foreground">
              <TypewriterText text={s.title} delay={titleDelay} speed={30} />
            </h3>
            <p className="mt-2 min-h-[4.5rem] text-sm text-muted-foreground">
              <TypewriterText text={s.text} delay={textDelay} speed={12} />
            </p>
          </li>
        );
      })}
    </ol>
  );
}