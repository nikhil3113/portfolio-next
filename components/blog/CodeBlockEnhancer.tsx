"use client";

import { useEffect } from "react";

type CodeBlockEnhancerProps = {
  containerId: string;
};

export function CodeBlockEnhancer({ containerId }: CodeBlockEnhancerProps) {
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const enhanceBlock = (block: HTMLPreElement) => {
      if (block.dataset.codeEnhanced === "true") return () => {};

      const code = block.querySelector("code");
      if (!code) return () => {};

      const language = code.dataset.language;
      const languageLabel = document.createElement("span");
      languageLabel.className = "code-language-label";
      languageLabel.textContent = language ?? "Code";
      languageLabel.setAttribute("aria-hidden", "true");

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "code-copy-button";
      copyButton.textContent = "Copy";
      copyButton.setAttribute("aria-label", "Copy code to clipboard");

      const status = document.createElement("span");
      status.className = "sr-only";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      let resetTimeout: number | undefined;

      const handleCopy = async () => {
        try {
          await navigator.clipboard.writeText(code.textContent ?? "");
          if (resetTimeout !== undefined) window.clearTimeout(resetTimeout);
          copyButton.textContent = "Copied";
          copyButton.setAttribute("aria-label", "Code copied to clipboard");
          status.textContent = "Code copied to clipboard";
          resetTimeout = window.setTimeout(() => {
            copyButton.textContent = "Copy";
            copyButton.setAttribute("aria-label", "Copy code to clipboard");
          }, 1800);
        } catch {
            copyButton.textContent = "Unable to copy";
          copyButton.setAttribute("aria-label", "Unable to copy code");
          status.textContent = "Unable to copy code";
        }
      };

      copyButton.addEventListener("click", handleCopy);
      block.append(languageLabel, copyButton, status);
      block.dataset.codeEnhanced = "true";

      return () => {
        if (resetTimeout !== undefined) window.clearTimeout(resetTimeout);
        copyButton.removeEventListener("click", handleCopy);
        languageLabel.remove();
        copyButton.remove();
        status.remove();
        delete block.dataset.codeEnhanced;
      };

    };

    const enhanceBlocks = () =>
      Array.from(container.querySelectorAll<HTMLPreElement>("pre")).map(
        enhanceBlock
      );

    const cleanups = enhanceBlocks();
    const observer = new MutationObserver(() => {
      enhanceBlocks().forEach((cleanup) => cleanups.push(cleanup));
    });
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [containerId]);

  return null;
}
