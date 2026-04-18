# SkyLink

## Stack
Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (auth + DB), PWA.
Max-width 430px mobile-first app.

## Commands
- Build: `npm run build`
- Deploy: `vercel --prod`
- No test suite yet

## Supabase
- Project ref: alinedfxqgkbbbbuzxjn
- CLI not authenticated — give SQL to run manually in dashboard

## Conventions
- CSS vars for theming (`var(--c-text1)`, `var(--c-card)`, etc.) — never hardcode colors
- Bottom nav z-50, sheets z-60, backdrops z-55
- Server Components by default, "use client" only when needed
- Brand purple: #7C6AF5

## How to work with me
- Be terse. Skip explanations unless I ask.
- Don't summarize what you did — I can read the diff.
- Don't ask for confirmation — just do it.
- Combine related changes into one commit.
- Always build before deploying. If build fails, fix and retry.
- When I report a visual bug, read the relevant component first, then fix.
- Deploy after every change unless I say otherwise.
