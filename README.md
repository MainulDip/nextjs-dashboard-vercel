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

### Route Groups | `(directory)`:
Route Groups are created using folder with surrounding parentheses `()`, it used to organize files into logical groups without affecting the URL structure. Like `/dashboard/(overview)/page.tsx` becomes `/dashboard`, 

Also anything inside layout group is scoped to that url/route. Like in case of placing `loading.tsx` inside route groupe, will not pass it to its child route. 

### Suspense (with `unstable_noStore`) for granular control over Streaming specific components:
React Suspense can be used to stream specific components instead of streaming a whole page.

Suspense allows defer rendering parts of an application until some condition is met (e.g. data is loaded). dynamic components can be wrapped in Suspense. Then, pass it a fallback component to show while the dynamic component loads.

```tsx
// Async/Await Promise Should be called with `unstable_noStore` inside `RevenueCart` component
<Suspense fallback={<RevenueChartSkeleton/>}>
  <RevenueChart something={ok_to_receive_something_from_its_parent}/> 
</Suspense>
```

### Partial PreRendering | Applied Automatically When Dynamic Components are Wrapped In Suspense:
Currently, call to a dynamic function inside a route (e.g. noStore(), cookies(), etc), make entire route dynamic.

However, most routes are not fully static or dynamic. You may have a route that has both static and dynamic content. Like e-commerce site where majority of the product page is static, but cart and product recommendation are fetched dynamically.

Partial Prerendering leverages React's `Concurrent APIs` and uses `Suspense` to defer rendering parts of your application until some condition is met (e.g. data is loaded).

* Partial Pre-Rendering is applied automatically by NextJS, As long as Suspense is used to wrap the dynamic parts. Next.js will know which parts of the route are static and which are dynamic.

### Search and Pagination | `useSearchParams` | `usePathname` | `useRouter`:

`useSearchParams` -> allows to access current URL parameters. IE, search params for this URL `/dashboard/invoices?page=1&query=pending` will be `{page: '1', query: 'pending'}`

`usePathname` -> lets to read current URL pathname, ie, pathname of `/dashboard/invoices?page=1&query=pending` is `/dashboard/invoices`

`useRouter` -> enable navigation between routes/URL programmatically.

* import all of those form `import { usePathname, useSearchParams, useRouter } from 'next/navigation';` not from other places

```tsx
// page.tsx
// when Page is a Server Component (by Default), optional `params` and `searchParams` are available automatically
// docs -> https://nextjs.org/docs/app/api-reference/file-conventions/page
export default async function Page({ searchParams }: {
    searchParams?: {
        query?: string,
        page?: string
    }
}) {
    const query = searchParams?.query || '';
    const currentPage = Number(searchParams?.page) || 1;

    return (
        <div className="w-full">
            <div className="flex w-full">
                <h1 className={`${lusitana.className} text-2xl`}>Invoices</h1>
            </div>
            <div className="mt-4 flex">
                <Search placeholder="Search invoices..." />
                <CreateInvoice />
            </div>
            <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
                <Table query={query}
                    currentPage={currentPage}
                />
            </Suspense>
            <div className="mt-5 flex w-full">
                {/* <Pagination totalPages={totalPages} /> */}
            </div>
        </div>
    );
}

// search.tsx
'use client'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

export default function Search({ placeholder }: { placeholder: string }) {

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const {replace} = useRouter();

  function handleClick(term: string) {
    const params = new URLSearchParams(searchParams)
    if(term) {
      params.set('query', term)
    } else {
      params.delete('query')
    }

    const urlRoute = `${pathname}?${params.toString()}`

    replace(urlRoute) // updates the URL with the user's search data without reloading the page

    console.log(term)
    console.log(params.toString())
    console.log(urlRoute)
  }

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full"
        placeholder={placeholder}
        onChange={(e) => handleClick(e.target.value)}
        defaultValue={searchParams.get('query')?.toString()} 
        // will persist input field on page refresh/reload
      />
    </div>
  );
}
```

### useSearchParams() hook vs. the searchParams prop:
`searchParams` is only available as `Page()` prop when `page.tsx` is a server component.
`useSearchParams` is only available inside client components. As hooks are only available inside `use client` 

### Page.tsx and its props as Server Component:
when Page is a Server Component (by Default), optional `params` and `searchParams` are available automatically
docs -> https://nextjs.org/docs/app/api-reference/file-conventions/page

```tsx
export default function Page({
  params,
  searchParams,
}: {
  params: { slug: string },
  searchParams?: {
        query?: string,
        page?: string
    }
}) {
  return <h1>My Page</h1>
}
```

### `Debouncing`, Optimizing Database Fetching and `use-debounce` library:
`Debouncing` is a programming practice that limits the rate at which a function can fire. 

Implementing Debouncing:
- Trigger Event: When an event that should be debounced (like a keystroke in the search box) occurs, a timer starts.
- Wait: If a new event occurs before the timer expires, the timer is reset.
- Execution: If the timer reaches the end of its countdown, the debounced function is executed.

This can be implemented manually, but there is `use-debounce` npm package, to make thing easier.

```tsx
import { useDebouncedCallback } from 'use-debounce';
 
// useDebounceCallback cannot be from from inside a function, as it is a hook (3rd party / custom hook)
const handleSearch = useDebouncedCallback((props) => {
  // call inner block or a function
}, 300);
```
* here the inner block / function will only run after a specific time (300ms) of last call, in between call will be canaled