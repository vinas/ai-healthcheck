<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# shadcn/ui uses Base UI primitives, not Radix

shadcn was installed with **Base UI** (`@base-ui/react`) as the primitive layer instead of Radix UI. The `asChild` prop is a Radix-specific pattern powered by Radix's `Slot` — it does not exist in Base UI and will leak to the DOM, causing a React warning.

**Never use `asChild` on any shadcn component in this project.**

When you need a button that navigates, apply `buttonVariants()` (or the equivalent `*Variants` helper for other components) directly to a Next.js `<Link>` or `<a>` tag:

```tsx
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

<Link href="/somewhere" className={buttonVariants()}>Label</Link>
```

# `middleware.ts` is deprecated — use `proxy.ts`

Next.js 16 renamed the middleware file convention. The file must be named `proxy.ts` (at the project root) and export a function named `proxy`, not `middleware`.

```ts
// proxy.ts
export async function proxy(req: NextRequest) { ... }
```

Never create or reference `middleware.ts` in this project.
<!-- END:nextjs-agent-rules -->
