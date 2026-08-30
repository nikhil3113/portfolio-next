import * as cheerio from "cheerio";
import { common } from "lowlight";
import { createLowlight } from "lowlight";
import { toHtml } from "hast-util-to-html";

const lowlight = createLowlight(common);

const languageAliases: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  md: "markdown",
  html: "xml",
};

const languageLabels: Record<string, string> = {
  js: "JavaScript",
  javascript: "JavaScript",
  jsx: "JSX",
  ts: "TypeScript",
  typescript: "TypeScript",
  tsx: "TSX",
  sh: "Shell",
  shell: "Shell",
  bash: "Bash",
  yml: "YAML",
  yaml: "YAML",
  md: "Markdown",
  markdown: "Markdown",
  html: "HTML",
  xml: "XML",
  css: "CSS",
  go: "Go",
  python: "Python",
  json: "JSON",
};

function normalizeLanguage(language: string) {
  return languageAliases[language] ?? language;
}

export function highlightCodeBlocks($: ReturnType<typeof cheerio.load>) {
  const codeBlocks = $("pre > code");

  for (let index = 0; index < codeBlocks.length; index += 1) {
    const element = codeBlocks[index];
    const code = $(element);
    const languageClass = (code.attr("class") ?? "")
      .split(/\s+/)
      .find((className) => className.startsWith("language-"));

    if (!languageClass) continue;

    const language = normalizeLanguage(languageClass.slice("language-".length));
    if (!lowlight.registered(language)) continue;

    try {
      const highlighted = lowlight.highlight(language, code.text());
      code.html(toHtml(highlighted));
      const sourceLanguage = languageClass.slice("language-".length);
      code.attr("data-language", languageLabels[sourceLanguage] ?? sourceLanguage);
      code.addClass("hljs");
    } catch {
      // Keep unsupported or malformed blocks readable as plain text.
    }
  }
}
