import { About } from "@/components/landing/About";
import { ContactForm } from "@/components/landing/Contact";
import { Experience } from "@/components/landing/Experience";
import { ProjectCard } from "@/components/project/SampleProjectCard";
import { Skills } from "@/components/landing/Skills";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { getProjects } from "@/lib/action/projects";
import { Project } from "@/types/projects";
import Link from "next/link";

export default async function Home() {
  const project = await getProjects();
  return (
    <div>
      <section className="relative min-h-[85vh] sm:min-h-screen flex items-center justify-center">
        <BackgroundBeamsWithCollision>
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
              {/* Left side - Heading and social links */}
              <div className="text-center lg:text-left z-20">
                <h2 className=" text-4xl md:text-4xl lg:text-4xl xl:text-6xl font-bold text-black dark:text-white font-sans tracking-tight">
                  Nikhil Chavan <br />
                  <div className="relative inline-block w-max [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))]">
                    <div className="absolute left-0 top-[1px] bg-clip-text bg-no-repeat text-transparent bg-gradient-to-r py-4 from-purple-500 via-violet-500 to-pink-500 [text-shadow:0_0_rgba(0,0,0,0.1)]">
                      <span className="">Full Stack Developer</span>
                    </div>
                    <div className="relative bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 py-4">
                      <span className="">Full Stack Developer</span>
                    </div>
                  </div>
                </h2>
                {/* Resume Download Button */}
                <div className="mt-8 flex justify-center lg:justify-start">
                  <a
                    href="/resume.pdf"
                    download="Nikhil_Chavan.pdf"
                    className="group relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-medium transition duration-300 ease-out border-2 rounded-full shadow-md bg-background/80 backdrop-blur-sm border-primary/50 dark:hover:border-black hover:border-white"
                  >
                    <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 group-hover:translate-x-0 ease ">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V9"
                        ></path>
                      </svg>
                    </span>
                    <span className="absolute flex items-center justify-center w-full h-full text-foreground transition-all duration-300 transform group-hover:translate-x-full ease">
                      My Resume
                    </span>
                    <span className="relative invisible">My Resume</span>
                  </a>
                </div>

                <div className="flex justify-center lg:justify-start gap-4 mt-6">
                  <a
                    href="https://github.com/nikhil3113"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-primary transition-colors p-2"
                    aria-label="GitHub"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/nikhil-chavan-8b83ab184"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-primary transition-colors p-2"
                    aria-label="LinkedIn"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                  <a
                    href="mailto:chavann717@gmail.com"
                    className="text-foreground hover:text-primary transition-colors p-2"
                    aria-label="Email"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.104 10-8.104v11.817h-20z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Right side - Contact Form */}
              <div className="z-20 hidden lg:block">
                <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-2">
                  <ContactForm compact />
                </div>
              </div>
            </div>
          </div>
        </BackgroundBeamsWithCollision>
      </section>

      <section className="flex justify-center items-center">
        <About />
      </section>

      <section className="py-16 max-sm:py-5 max-w-5xl mx-auto">
        {/* Skills */}
        <div id="skills">
          <Skills />
        </div>

        {/* Work */}
        <div id="projects">
          <div className="max-w-3xl mx-auto text-center mb-0 mt-16">
            <p className="text-primary font-semibold mb-2 tracking-wide">
              Proof Of Work
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Projects</h2>
            <p className="text-muted-foreground max-sm:px-5">
              Explore a selection of my projects that showcase my technical
              skills and problem-solving abilities.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 p-0">
            {project.slice(0, 2).map((items: Project, idx: number) => (
              <ProjectCard
                key={idx}
                title={items.title}
                description={items.description}
                image={items.image}
                tags={items.tags}
                siteLink={items.siteLink}
                githubLink={items.githubLink}
              />
            ))}
          </div>
          <div className="flex justify-center mt-0 max-sm:px-5">
            <Link href="/projects" prefetch={true}>
              <InteractiveHoverButton text="More" />
            </Link>
          </div>
        </div>

        <div id="experience">
          <Experience />
        </div>

        <div className="mt-16 pt-4 max-sm:px-5" id="contact">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <p className="text-primary font-semibold mb-2 tracking-wide">
              GET IN TOUCH
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Contact Me</h2>
            <p className="text-muted-foreground max-sm:px-5">
              Have a question or want to work together? Send me a message.
            </p>
          </div>
          <ContactForm />

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">Or connect with me on</p>
            <div className="flex justify-center gap-6">
              <a
                href="https://github.com/nikhil3113"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center group"
              >
                <div className="bg-background p-3 rounded-full border border-border group-hover:border-primary transition-colors">
                  <svg
                    className="w-6 h-6 text-foreground group-hover:text-primary transition-colors"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </div>
                <span className="mt-2 text-sm font-medium group-hover:text-primary transition-colors">
                  GitHub
                </span>
              </a>
              <a
                href="https://www.linkedin.com/in/nikhil-chavan-8b83ab184"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center group"
              >
                <div className="bg-background p-3 rounded-full border border-border group-hover:border-primary transition-colors">
                  <svg
                    className="w-6 h-6 text-foreground group-hover:text-primary transition-colors"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </div>
                <span className="mt-2 text-sm font-medium group-hover:text-primary transition-colors">
                  LinkedIn
                </span>
              </a>
              <a
                href="mailto:chavann717@gmail.com"
                className="flex flex-col items-center group"
              >
                <div className="bg-background p-3 rounded-full border border-border group-hover:border-primary transition-colors">
                  <svg
                    className="w-6 h-6 text-foreground group-hover:text-primary transition-colors"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.104 10-8.104v11.817h-20z" />
                  </svg>
                </div>
                <span className="mt-2 text-sm font-medium group-hover:text-primary transition-colors">
                  Email
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
