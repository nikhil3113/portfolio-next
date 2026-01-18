import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export interface TOCHeading {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ headings }: { headings: TOCHeading[] }) {
  if (!headings || headings.length === 0) return null;

  const buildList = (headings: TOCHeading[], parentLevel = 2) => (
    <ul className="pl-2 md:pl-4 border-l border-muted-foreground/30 ml-2">
      {headings.map((h, idx) => (
        <li key={h.id + idx}>
          <a
            href={`#${h.id}`}
            className={cn(
              "block py-1 px-2 mb-1 text-muted-foreground rounded  hover:text-primary transition font-medium text-xs md:text-sm shadow-sm",
              h.level === 2 && "pl-0 text-base font-semibold tracking-wide",
              h.level === 3 && "pl-2 text-sm",
              h.level > 3 && "pl-3 text-xs"
            )}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ul>
  );

  return (

    <Accordion type="single" collapsible>
      <AccordionItem value="toc">
        <AccordionTrigger className="w-full text-lg px-2 font-bold pb-2 mb-2 tracking-wider">
          Table of Contents
        </AccordionTrigger>
        <AccordionContent className="overflow-y-auto max-h-80 pr-1 transition-all duration-300 ease-in-out">
          {buildList(headings)}
        </AccordionContent>
      </AccordionItem>
    </Accordion>

  );
}