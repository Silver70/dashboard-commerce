# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt 3 dashboard template built with Nuxt UI, featuring a modern admin interface with multiple pages, collapsible sidebar, dark/light theme support, and data visualization capabilities.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server on localhost:3000
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run linting
pnpm lint

# Run type checking
pnpm typecheck
```

## Key Dependencies & Stack

- **Nuxt 3** (`^4.1.2`) - Vue.js framework
- **Nuxt UI** (`^4.0.0`) - Component library and design system
- **Unovis** - Data visualization components
- **VueUse** - Vue composition utilities
- **date-fns** - Date manipulation
- **Zod** - Schema validation
- **TypeScript** - Type safety

## Architecture & Structure

### Core Application Structure

- `app/app.vue` - Root app component with SEO meta setup
- `app/layouts/default.vue` - Main dashboard layout with sidebar navigation
- `app/types/index.d.ts` - TypeScript type definitions for User, Mail, Product, etc.

### Pages & Routing

File-based routing in `app/pages/`:

- `/` - Home dashboard (index.vue)
- `/products` - Product management
- `/customers` - Customer management
- `/inbox` - Message inbox
- `/settings` - Settings with nested routes

### Navigation Structure

Sidebar navigation defined in `app/layouts/default.vue` with:

- Main links: Home, Products, Inbox, Customers
- Collapsible Settings section with: General, Members, Notifications, Security
- Command palette search functionality
- External links: Feedback, Help & Support

### Components Organization

```
app/components/
├── customers/     # Customer-related components
├── home/          # Dashboard home components
├── inbox/         # Inbox/messaging components
└── settings/      # Settings page components
```

### API Routes

Server-side API endpoints in `server/api/` for backend functionality.

## Configuration Notes

### ESLint Configuration

- Extends Nuxt's built-in ESLint config
- Custom rules: `vue/no-multiple-template-root: off`, max 3 attributes per line
- Stylistic config: no trailing commas, 1tbs brace style

### Nuxt Configuration

- Modules: `@nuxt/eslint`, `@nuxt/ui`, `@vueuse/nuxt`
- CORS enabled for `/api/**` routes
- CSS: Main stylesheet at `~/assets/css/main.css`

## Type System

Key TypeScript interfaces defined in `app/types/index.d.ts`:

- `User` - User entity with status, location, avatar
- `Product` - Product with price, stock tracking
- `Mail` - Email/message structure
- `Sale` - Transaction with status tracking
- `Notification` - System notifications
- `Member` - Team member with roles

## Theme & Styling

- Built-in dark/light mode support via `useColorMode()`
- Theme color automatically adapts: `#1b1718` (dark) / `white` (light)
- Uses Nuxt UI design tokens and components
- Lucide icons integrated via Iconify

## Package Manager

Uses **pnpm** as the package manager (specified in package.json). Always use `pnpm` commands instead of npm.

## CHANGELOG

when ever you bring a change, record it here after finishing it.
