## UI Pro Max Stack Guidelines
**Stack:** nextjs | **Query:** server components image performance
**Source:** stacks/nextjs.csv | **Found:** 3 results

### Result 1
- **Category:** Rendering
- **Guideline:** Use Server Components by default
- **Description:** Server Components reduce client JS bundle
- **Do:** Keep components server by default
- **Don't:** Add 'use client' unnecessarily
- **Code Good:** export default function Page()
- **Code Bad:** ('use client') for static content
- **Severity:** High
- **Docs URL:** https://nextjs.org/docs/app/building-your-application/rendering/server-components
- **Applies To:** nextjs 16.2
- **Status:** active
- **Verified At:** 2026-08-13

### Result 2
- **Category:** DataFetching
- **Guideline:** Fetch data in Server Components
- **Description:** Fetch directly in async Server Components
- **Do:** async function Page() { const data = await fetch() }
- **Don't:** useEffect for initial data
- **Code Good:** const data = await fetch(url)
- **Code Bad:** useEffect(() => fetch(url))
- **Severity:** High
- **Docs URL:** https://nextjs.org/docs/app/building-your-application/data-fetching
- **Applies To:** nextjs 16.2
- **Status:** active
- **Verified At:** 2026-08-13

### Result 3
- **Category:** Performance
- **Guideline:** Use dynamic imports
- **Description:** Code split with next/dynamic
- **Do:** dynamic() for heavy components
- **Don't:** Import everything statically
- **Code Good:** const Chart = dynamic(() => import('./Chart'))
- **Code Bad:** import Chart from './Chart'
- **Severity:** Medium
- **Docs URL:** https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading
- **Applies To:** nextjs 16.2
- **Status:** active
- **Verified At:** 2026-08-13

