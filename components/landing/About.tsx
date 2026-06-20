import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/components/ui/terminal";

export function About() {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <h3 className="text-3xl md:text-4xl font-bold mb-10 text-primary text-center">
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
