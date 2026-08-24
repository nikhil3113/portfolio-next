---
name: Deep Slate & Neon
colors:
  surface: '#111508'
  surface-dim: '#111508'
  surface-bright: '#363b2c'
  surface-container-lowest: '#0c1005'
  surface-container-low: '#191d10'
  surface-container: '#1d2114'
  surface-container-high: '#272c1d'
  surface-container-highest: '#323728'
  on-surface: '#e1e5cf'
  on-surface-variant: '#c2caad'
  inverse-surface: '#e1e5cf'
  inverse-on-surface: '#2e3223'
  outline: '#8c9479'
  outline-variant: '#434933'
  surface-tint: '#a0d800'
  primary: '#ffffff'
  on-primary: '#253600'
  primary-container: '#b7f700'
  on-primary-container: '#506e00'
  inverse-primary: '#4b6700'
  secondary: '#bec6e0'
  on-secondary: '#283044'
  secondary-container: '#3f465c'
  on-secondary-container: '#adb4ce'
  tertiary: '#ffffff'
  on-tertiary: '#233240'
  tertiary-container: '#d4e4f7'
  on-tertiary-container: '#576676'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#b7f700'
  primary-fixed-dim: '#a0d800'
  on-primary-fixed: '#141f00'
  on-primary-fixed-variant: '#374e00'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d4e4f7'
  tertiary-fixed-dim: '#b8c8da'
  on-tertiary-fixed: '#0d1d2a'
  on-tertiary-fixed-variant: '#394857'
  background: '#111508'
  on-background: '#e1e5cf'
  surface-variant: '#323728'
  slate-900: '#0F172A'
  slate-800: '#1E293B'
  slate-400: '#94A3B8'
  pure-white: '#FFFFFF'
  electric-lime: '#BDFF00'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 64px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  code-snippet:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.7'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  section-gap-desktop: 128px
  section-gap-mobile: 64px
  gutter: 24px
  container-max: 1120px
---

## Brand & Style

This design system is built for the high-end Full Stack Developer, blending technical precision with a modern, editorial aesthetic. The brand personality is **authoritative, minimalist, and architecturally sound**. It targets engineering managers and founders who value clean code and sophisticated problem-solving.

The visual style is a hybrid of **Minimalism** and **Modern Corporate**, utilizing heavy whitespace to let the content breathe and high-contrast typography to establish an immediate hierarchy. It avoids unnecessary decoration, instead using structural elements like subtle borders and intentional "code-like" containers to signify a developer's environment. The emotional response should be one of trust and technical competence.

## Colors

The palette is anchored by **Deep Slate (#0F172A)**, providing a more sophisticated and softer depth than pure black. This serves as the primary canvas. The system uses a high-contrast **Pure White** for primary text to ensure maximum legibility.

A single vibrant accent, **Electric Lime (#BDFF00)**, is used sparingly for critical calls to action, focus states, and small decorative indicators. This color choice breaks the corporate monotony with a "neon-terminal" energy. Grays are pulled from the Slate scale to maintain a cool, cohesive temperature across borders, metadata, and secondary text.

## Typography

Typography is the primary driver of the design's hierarchy. **Hanken Grotesk** is used for headings, providing a sharp, contemporary feel with tight tracking. **Inter** handles the body copy for its exceptional readability in technical contexts. **JetBrains Mono** is introduced for labels, metadata, and "About Me" blocks to reinforce the developer-centric narrative.

Scale is aggressive. Hero sections use massive display weights, while metadata uses small, tracked-out monospaced labels. Mobile typography scales down significantly to maintain readability without overwhelming the viewport.

## Layout & Spacing

The layout follows a **Fixed Grid** approach for desktop, centering content within a 1120px container to prevent excessive line lengths. A 12-column grid is used for project showcases and skill sections.

The spacing rhythm is generous, particularly between sections, to create an "editorial" feel. A base unit of 8px guides all component-level spacing. 
- **Desktop:** 128px vertical gaps between major narrative blocks.
- **Tablet:** 80px gaps, transitioning to a 2-column project grid.
- **Mobile:** 64px gaps with 16px side margins; all grids collapse to a single column.

## Elevation & Depth

This design system avoids traditional shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**. Depth is established by shifting background colors between Slate-900 and Slate-800.

- **Surface Level:** Slate-900 (Global Background).
- **Raised Level:** Slate-800 with a 1px border of Slate-400 at 10% opacity.
- **Interactive Level:** When hovering over project cards, the border opacity increases, or a subtle "glow" is emitted using the primary accent color with a high blur and very low opacity.
- **Glassmorphism:** Navigation bars use a backdrop filter (blur 12px) with a semi-transparent Slate-900 fill to maintain context while scrolling.

## Shapes

The shape language is "Softly Geometric." Most containers and cards use a **0.5rem (8px)** radius to balance the sharp typography with a modern, approachable feel. 

Pills and technology tags are fully rounded (9999px) to contrast against the structured grid of the cards. Buttons follow the container roundedness of 8px, maintaining a consistent professional silhouette.

## Components

### Buttons
Primary buttons use the **Electric Lime** background with black text for maximum punch. Secondary buttons are outlined with a 1px Slate-400 border. Both feature an 8px radius and a subtle lift effect on hover.

### Cards
Project cards are defined by a Slate-800 background and a subtle border. They should include a "Tech Stack" row at the bottom using monospaced labels. Images within cards should have a slightly smaller radius (4px) than the parent container.

### Inputs
Form fields use a Slate-800 fill and a bottom-border-only style for a minimal look, or a full 1px border that turns **Electric Lime** on focus. Labels must use the monospaced font style.

### Chips/Tags
Used for skills. These are small, fully rounded elements with a Slate-800 background. They should not have borders unless they represent a "category" of skill.

### The "About Me" Code Block
A signature component. This should look like an IDE window with a header containing three colored dots (red, yellow, green) and a monospace text area. It uses a Slate-800 background to separate it from the main page flow.