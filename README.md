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
* here the inner block / function will only run after a specific time (300ms) after last call, calling within 300ms will be ignored

### Pagination:
Browser has some APIs to load a page without doing a full/hard refresh. In nextJS, this is done using `replace` of `useRouter()` from `/next/navigation`.

* It will trigger a re-render (server/client) of the Route, so the `Page()` component will run again and can collect changed/new urlParameters from the url and we can  do a lot of things with this, like implementing pagination through fetching form database from server component or filtering form client component.

Inspect <a href="./app/dashboard/invoices/page.tsx">/dashboard/invoices/page.tsx</a> & <a href="./app/ui/invoices/pagination.tsx">/ui/invoices/pagination.tsx</a>

### Data Mutation,, Form and `React Server Actions`:
`React Server Actions` are to run asynchronous code directly on the server, eliminating the need to create API endpoints to mutate data. With this asynchronous functions execute on the server and can be invoked from Client or Server Components.

Security is achieved through techniques like `POST requests`, `encrypted closures`, `strict input checks`, `error message hashing`, and `host restrictions`

* `<form>` with Server Actions: `action` attribute in the `<form>` element is used to invoke an action, which will receive `FormData` object with the captured/form data

```tsx
// Server Component
export default function Page() {
  // Action
  async function create(formData: FormData) {
    'use server';
    const rawFormData = {
      fieldName: formData.get('fieldName') // the field name will be passed form from once that is submitted
    };

    // const rawFormData = Object.fromEntries(formData.entries()) // concise way to extract form data

    console.log(rawFormData);
   /* output
   {
      customerId: '50ca3e18-62cd-11ee-8c99-0242ac120002',
      amount: '',
      status: null
    }
    */
  }
 
  // Invoke the action using the "action" attribute, the create fn's formData param will be populated with the user input data and start fn call once submit btn is pressed
  return (<form action={create}>
            <input name="fieldName" {...otherParams}/>
            <Button type="submit">Submit</Button>
          </form>);
}
```

in React, the action attribute is considered a special prop - meaning React builds on top of it to allow actions to be invoked.

Behind the scenes, Server Actions create a POST API endpoint, so no need to create API endpoints manually with Server Actions.

* An advantage of invoking a Server Action within a Server Component is `progressive enhancement` - forms work even if JavaScript is disabled on the clients

`caching` and Server Actions: When a form is submitted through a Server Action, not only can you use the action to mutate data, but you can also revalidate the associated cache using APIs like revalidatePath and revalidateTag.

### `Zod` Lib for type validation (user form input collection & validation):
Zod is a TypeScript-first validation library.

It has primitive type (string, boolean, number, etc) functions, `parse` and `safeParse` for parsing and validation, `coerce` for type conversion, `object` for defining complex type

ie, `z.coerce.string()` to make any type into string. coerce: to compel by force
Docs => https://zod.dev/?id=basic-usage

```js
import { z } from "zod";

// creating a schema for strings
const mySchema = z.string();

// parsing
mySchema.parse("tuna"); // => "tuna"
mySchema.parse(12); // => throws ZodError

// "safe" parsing (doesn't throw error if validation fails)
mySchema.safeParse("tuna"); // => { success: true; data: "tuna" }
mySchema.safeParse(12); // => { success: false; error: ZodError }

// complex type
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const User = z.object({
  username: z.string(),
});

User.parse({ username: "Ludwig" });

// extract the inferred type
type User = z.infer<typeof User>; // { username: string }
```

* Coercion

```js
const schema = z.coerce.string();
schema.parse("tuna"); // => "tuna"
schema.parse(12); // => "12"
schema.parse(true); // => "true"
```

* validation helpers: 

```js
const name = z.string({
  required_error: "Name is required",
  invalid_type_error: "Name must be a string",
});

// .min(5, { message: "error case" });
// .max(5);
// .length(5);
// .email();
// .url();
// .emoji();
// .uuid();
// .includes("tuna", { message: "Must include tuna" });
// .startsWith("https://", { message: "Must provide secure URL" });
// .endsWith(".com", { message: "Only .com domains allowed" });
// .datetime({ message: "Invalid datetime string! Must be UTC." });
// .ip({ message: "Invalid IP address" });

```

* Date and DateTime Validation

```js
const datetime = z.string().datetime();

datetime.parse("2020-01-01T00:00:00Z"); // pass
datetime.parse("2020-01-01T00:00:00.123Z"); // pass
datetime.parse("2020-01-01T00:00:00.123456Z"); // pass (arbitrary precision)
datetime.parse("2020-01-01T00:00:00+02:00"); // fail (no offsets allowed)

// date
z.date().safeParse(new Date()); // success: true
z.date().safeParse("2022-01-12T00:00:00.000Z"); // success: false
```

Docs => https://zod.dev/?id=basic-usage

* `.pick` (keep certain keys) & `.omit` (remove certain keys)
```js
const Recipe = z.object({
  id: z.string(),
  name: z.string(),
  ingredients: z.array(z.string()),
});

const JustTheName = Recipe.pick({ name: true });
type JustTheName = z.infer<typeof JustTheName>;
// => { name: string }

const NoIDRecipe = Recipe.omit({ id: true });

type NoIDRecipe = z.infer<typeof NoIDRecipe>;
// => { name: string, ingredients: string[] }
```

### NextJS form validation with `Zod` and RevalidatePath to clean cache:
```js
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({id: true, date: true}) // removing id & date prop for now
 
export async function createInvoice(formData: FormData) {
  const {customerId, amount, status} = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  await sql`
  INSERT INTO invoices (customer_id, amount, status, date)
  VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  // clear cache --forced, as NextJS imply caches through `Client-side Router Cache` that store the route segments in browser
  // with prefetching technique. revalidatePath('route') will force clear cache and trigger db query on that specified route.
  revalidatePath('/dashboard/invoices');

  redirect('/dashboard/invoices') // triggering a redirect
}
```

### NextJS Caching:
https://nextjs.org/docs/app/building-your-application/caching#router-cache

### Dynamic Route Segment `[id]`:
dynamic route segments are created by wrapping a folder's name in square brackets. For example, [id], [post] or [slug]. like `/dashboard/invoices/[id]/edit/page.tsx`