import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/components/ui/terminal";

export function About() {
  return (
    <div className="mx-auto mb-8 w-full max-w-2xl">
        <h3 className="mb-12 text-center text-3xl font-bold text-accent-text md:text-4xl">
        About Me
      </h3>
      <Terminal>
        <TypingAnimation>
          👋 Greetings! I&apos;m Nikhil Chavan — a Full Stack Developer with 1.5
          years of experience.
        </TypingAnimation>

        <AnimatedSpan>
          🚀 Building high-impact, performant web applications.
        </AnimatedSpan>

        <AnimatedSpan>
          🧩 Expertise: RESTful APIs, auth, & third-party integrations.
        </AnimatedSpan>

        <AnimatedSpan>
          🗄️ Databases: Proficient in MongoDB & MySQL.
        </AnimatedSpan>

        <AnimatedSpan>🛠️ From custom Next.js SEO tools...</AnimatedSpan>

        <AnimatedSpan>
          🏗️ ...to production backends deployed with PM2 & Nginx.
        </AnimatedSpan>

        <TypingAnimation>
          ✨ Always exploring new tech & delivering clean, maintainable code!
        </TypingAnimation>
      </Terminal>
    </div>
  );
}
