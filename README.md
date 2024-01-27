### API Endpoints | Route Handlers:
Route Handlers are defined in a route.js|ts file inside the app directory. They are the equivalent of API Routes inside the pages directory but both will not work together.

* Route Handlers can be nested inside the app directory, similar to page.js and layout.js. But there cannot be a route.js file at the same route segment level as page.js.

* `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, and `OPTIONS` are supported
```ts
// app/api/route.ts
export async function GET() {
  const res = await fetch('https://data.mongodb-api.com/...', {
    headers: {
      'Content-Type': 'application/json',
      'API-Key': process.env.DATA_API_KEY,
    },
  })
  const data = await res.json()
 
  return Response.json({ data })
}
```

docs => https://nextjs.org/docs/app/building-your-application/routing/route-handlers

### DB query, WaterFall vs parallel Request:
Database query can be done using RAW `SQL` or `noSQL` or Using a ORM like `Prisma`. DB query should be done from server component, not from client anyway.

Fetching data with Server Components don't require useEffect, useState or data fetching libraries and can be done directly using `async/await` and `Promise API`.

* WaterFall/Synchronous Request: Inside `async` function, each `await` call will block further code execution until finished.

* Parallel/Asynchronous Request: Inside `async` function, initiate all request inside of `Promise.all()` or `Promise.allSettled()`, which initiate all request at the same time, and return when all are finished.

```js
// Parallel Request Demo
export async function fetchCardData() {
  try {
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;
 
    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);
    // ...
  }
}
```

### Static Vs Dynamic Rendering of DB Queries:
With static rendering, data fetching and rendering happens on the server at build time, and results are cached. So can be used by CDN. Dynamic Rendering is opposite, fetch and serve query on-demand.

By Default, `sql` form `'@vercel/postgres'` uses Static Rendering. To use Dynamic part, we need to use `unstable_noStore` from `'next/cache'` and call.

```js
import { unstable_noStore as noStore } from 'next/cache';
 
export async function fetchRevenue() {
  // making the request `Dynamic` and Stopping Cache
  // This is equivalent to in fetch(..., {cache: 'no-store'}).
  noStore();
 
  // ...
}
```

### Streaming (non blocking progressive data fetching) | loading.tsx and Suspense:
Streaming is a data transfer technique that allows you to break down a route into smaller "chunks" and progressively stream (parallel fetch) them from the server to the client as they become ready. Like breaking down a complex component into dynamic (fetch data) and static component, and use placeholder UI (like `loading.tsx`) until dynamic component is ready with data from the database. 

* 2 ways to implement streaming in NextJS, using page level `loading.tsx` and using `<Suspense>` for component specific procedure.

* `loading.tsx` is a special NextJS file built on React Suspense, it's to create fallback UI to show as a replacement while page content loads. This is supplied automatically By NextJS while the `page.tsx` is on loading condition for server components (if not market with `use client`). Static components defined on `layout.tsx` will not be affected.

```jsx
import DashboardSkeleton from '@/app/ui/skeletons';
 
export default function Loading() {
  return <DashboardSkeleton />; // this with be shown until server components are available in the `page.tsx`
}
```