# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Via Mortis** is a sophisticated Astro demo site for a macabre tourism & haunted attraction business. This is the fifth demo in a portfolio showcase series, focusing on advanced glitch effects and unsettling user experiences.

## Technology Stack

- **Framework**: Astro 5.11.0 with TypeScript
- **Styling**: SCSS with sophisticated glitch effects
- **Fonts**: Creepster (scary headings) + Inter (clean body text) + Fira Code (monospace)
- **Focus**: Advanced CSS animations, SVG filters, and interactive horror elements

## Architecture

```
src/
├── layouts/
│   └── BaseLayout.astro          # Main layout with loading screen & global effects
├── components/
│   ├── GlitchTransition.astro    # Sophisticated glitch transition effects
│   ├── PostCard.astro            # Interactive cards with liquid fill effects
│   ├── displacementMap.astro     # SVG displacement mapping for distortion
│   └── PourAnimation.astro       # Animated beer pour effect for hero
├── styles/
│   ├── global.scss               # Global styles and base components
│   ├── _variables.scss           # Color palette and design tokens
│   └── _glitch-effects.scss      # Advanced glitch animation library
└── pages/
    └── index.astro               # Main landing page with all sections
```

## Design System

### Color Palette
- **Primary**: Dark red (#490000), Blood red (#e90000)
- **Secondary**: Scream green (#bbff00)
- **Accent**: Tarnished brass (#4b4b01)
- **Neutrals**: Pure black (#000), Ghost white (#f8f8f8), Fog gray (#2a2a2a)

### Typography
- **Headlines**: 'Creepster' (Google Fonts) - scary, decorative
- **Body**: 'Inter' - clean, readable sans-serif
- **Code**: 'Fira Code' - monospace for technical elements

## Key Features & Effects

### 1. Sophisticated Glitch Effects
- **Horizontal screech distortion**: CSS clip-path with transform animations
- **Color channel separation**: Red/green channel offsets with blend modes
- **CT scanline animation**: Repeating linear gradients with position animation
- **Broken monitor effect**: Filter combinations (blur, contrast, brightness)

### 2. Interactive Components
- **Liquid fill cards**: CSS height transitions with gradient overlays
- **Displacement mapping**: SVG feTurbulence + feDisplacementMap filters
- **Pour animation**: Complex CSS animations with particle effects
- **Distorted hover states**: Filter combinations with hue-rotate and blur

### 3. Loading & Transition Effects
- **Skeleton screen**: "Broken monitor" loading state
- **Page transitions**: Automatic glitch effects on route changes
- **Scroll-triggered animations**: Intersection Observer for section reveals
- **Ambient effects**: Subtle mouse-following transforms and random glitches

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Component Usage

### GlitchTransition
```astro
<GlitchTransition trigger="hover" intensity="medium" duration={300}>
  <h1>Text to glitch</h1>
</GlitchTransition>
```

### DisplacementMap
```astro
<DisplacementMap intensity={15} frequency={0.02} className="custom-class">
  <div>Content to distort</div>
</DisplacementMap>
```

### PourAnimation
```astro
<PourAnimation trigger="scroll" className="hero-animation" />
```

## Styling Conventions

- Use SCSS variables from `_variables.scss` for all colors and measurements
- Apply glitch effects from `_glitch-effects.scss` via CSS classes
- Follow mobile-first responsive design patterns
- Include accessibility considerations (reduced motion, focus states)
- Maintain unsettling aesthetic while ensuring usability

## Performance Considerations

- Images are optimized via Unsplash URLs with specific dimensions
- CSS animations use `transform` and `opacity` for better performance
- SVG filters are hardware-accelerated where possible
- Intersection Observer used for scroll-triggered animations
- Prefers-reduced-motion media queries included for accessibility

## Content Theme

The site maintains a macabre tourism theme with:
- Haunted attraction descriptions
- Horror-themed event calendar
- Unsettling copy that creates atmosphere
- Warning notices for psychological effects
- Gothic/horror aesthetic throughout

This project demonstrates advanced CSS animation techniques, sophisticated glitch effects, and the creation of an unsettling user experience while maintaining accessibility and performance standards.