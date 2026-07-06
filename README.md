# llinkup

Campus event discovery and friend matching for students.

llinkup helps students find campus events, show interest in activities, and discover classmates with overlapping interests. It is an AI-assisted full-stack prototype built to explore how lightweight social matching can make campus life easier to join.

## Status

Private prototype being prepared for public portfolio review. Before switching the GitHub repository to public, rotate any Supabase keys that were previously committed and configure fresh deployment secrets.

## Features

- Browse campus events by category.
- Sign up or sign in with Supabase Auth.
- Mark interest in events.
- Build a student profile with year, bio, avatar, and interests.
- Match with classmates based on shared interests and event activity.
- Use Supabase row-level security for profile and event-interest data.

## Tech Stack

- React 19
- TypeScript
- TanStack Router and TanStack Start
- TanStack Query
- Supabase Auth and Postgres
- Tailwind CSS
- shadcn/ui and Radix UI primitives
- Bun

## AI-Assisted Workflow

This repository is an AI-assisted project. The product flow, UI iteration, and implementation were developed with modern AI coding tools, then reviewed and organized for readability, setup clarity, and public portfolio presentation.

The goal of this repo is not to pretend every line was handwritten. The goal is to show product thinking, tool fluency, full-stack integration, and the ability to turn an idea into a working application.

## Local Setup

Install dependencies:

```bash
bun install
```

Create a local environment file:

```bash
cp .env.example .env
```

Fill in the Supabase values in `.env`.

Run the development server:

```bash
bun run dev
```

Build for production:

```bash
bun run build
```

Run linting:

```bash
bun run lint
```

## Environment Variables

See `.env.example` for the required variables.

Client-side variables prefixed with `VITE_` are visible in the browser. Never place private service-role keys in a `VITE_` variable.

## Database

Supabase schema migrations live in `supabase/migrations`.

The app uses tables for:

- user profiles
- campus events
- event interest registrations

Run the migrations against a Supabase project before using the app end-to-end.

## Public Release Checklist

- Rotate any Supabase keys that were ever committed.
- Add fresh environment variables in the deployment platform.
- Confirm Supabase RLS policies match the intended public/private behavior.
- Add a live deployment link here when available.
- Choose and add a license before inviting external reuse.



