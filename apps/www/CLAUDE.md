# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in the apps/www directory.

## Project Overview

This is the marketing/landing page template. It's a Next.js 15.3.0 application with full internationalization support (Korean/English) and serves as a public-facing website template for any product.

## Commands

### Development

- `pnpm dev` - Start dev server on port 3000
- `pnpm build` - Build for production
- `pnpm lint` - Lint the codebase
- `pnpm typecheck` - Type check TypeScript files

### Running from Root

- `pnpm --filter www dev` - Start www dev server from monorepo root
- `pnpm --filter www build` - Build www app from root

## Architecture

### Directory Structure

- **app/[locale]/**: Next.js App Router with i18n dynamic routing
- **src/components/**: Reusable components and sections
- **src/i18n/**: Internationalization setup and locale files
- **src/integrations/**: Third-party service integrations
- **src/lib/**: Utility functions and configurations
- **public/**: Static assets, images, and branding

### Tech Stack

- **Framework**: Next.js 15.3.0 with App Router
- **Language**: TypeScript 5.8.3
- **UI**: Tailwind CSS, shadcn/ui (from @myapp/ui)
- **Animation**: Framer Motion
- **i18n**: next-intl
- **Analytics**: Google Analytics 4, Microsoft Clarity
- **Support**: Crisp chat, Discord
- **Font**: Pretendard Variable (Korean-optimized)

## Development Guidelines

### Page Component Pattern

```tsx
// app/[locale]/page.tsx - minimal page component
export default function Page() {
  return <Home />;
}

// src/pages/home/Home.tsx - actual implementation
export const Home = () => {
  // Component logic here
};
```

### Component Organization

- **Section Components**: Each landing page section is a separate component
- **Composition**: Build pages by composing section components
- **Client/Server Split**: Use "use client" only when necessary
- **Shared UI**: Import from @myapp/ui package

### i18n Implementation

```tsx
// Server component
import { getTranslations } from "next-intl/server";
const t = await getTranslations("namespace");

// Client component
import { useTranslations } from "next-intl";
const t = useTranslations("namespace");
```

### Styling Guidelines

- Use Tailwind CSS classes
- Follow the design system from root CLAUDE.md
- Use `cn()` utility for conditional classes
- Maintain 8pt grid spacing system

### Analytics Integration

All pages should be wrapped with LogScreen:

```tsx
<LogScreen name="PageName">{/* Page content */}</LogScreen>
```

### Component Checklist

When creating new components:

- [ ] Follow section-based component pattern
- [ ] Add i18n support for all text
- [ ] Include proper TypeScript types
- [ ] Add Framer Motion animations where appropriate
- [ ] Integrate logging for user interactions
- [ ] Ensure mobile responsiveness
- [ ] Test in both Korean and English locales

## Key Files

### Configuration

- `next.config.ts` - Next.js configuration with i18n
- `tailwind.config.ts` - Tailwind configuration
- `src/i18n/config.ts` - i18n configuration

### Components

- `src/components/layout/Header.tsx` - Main navigation
- `src/components/sections/*` - Landing page sections
- `src/components/ui/language-switcher.tsx` - Locale switcher

### Integrations

- `src/integrations/analytics.tsx` - GA4 setup
- `src/integrations/clarity.tsx` - Clarity setup
- `src/integrations/discord-fab.tsx` - Discord support

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_GA_ID` - Google Analytics ID
- `NEXT_PUBLIC_CLARITY_ID` - Microsoft Clarity ID
- Any additional service IDs for integrations

## Common Tasks

### Adding a New Section

1. Create component in `src/components/sections/`
2. Add translations to locale JSON files
3. Import and add to Home component
4. Test animations and responsiveness

### Adding a New Page

1. Create folder in `app/[locale]/pagename/`
2. Add minimal page.tsx that imports component
3. Create component in `src/pages/pagename/`
4. Add translations for the page
5. Update navigation if needed

### Updating Translations

1. Edit `src/i18n/locales/en.json` for English
2. Edit `src/i18n/locales/ko.json` for Korean
3. Use consistent key naming conventions
4. Test both locales after changes

## Best Practices

- Keep page components minimal
- Leverage server components for static content
- Use client components only for interactivity
- Maintain consistent animation patterns
- Always include both Korean and English translations
- Test on mobile devices
- Monitor bundle size with `pnpm build`

<c2c-rules>
- @c2c-rules/_root.md
</c2c-rules>
