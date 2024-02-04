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
  revalidatePath('/dashboard/invoices'); // also it will re-render/re-compose the route specified, which will update UI Screen

  redirect('/dashboard/invoices') // triggering a redirect to the updated page. Where updates are applied ahead of time already
}
```

### NextJS Caching
https://nextjs.org/docs/app/building-your-application/caching#router-cache

### Dynamic Route Segment `[id]`:
dynamic route segments are created by wrapping a folder's name in square `[....]` brackets. For example, [id], [post] or [slug]. like `/dashboard/invoices/[id]/edit/page.tsx`.


### `try/catch`, `error.tsx` and Error Handling:
All database queries should be wrapped in try/catch block in side server actions
```js
try {
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
} catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
}
```

* `error.tsx` => used to define a UI boundary for a route segment. It serves as a catch-all for unexpected errors and allows you to display a fallback UI to your users. As the error will show on front-end, it must be `'use client'`. All routes inside of it (children routes) will fall back to parent's `error.tsx` when error is triggered. like failed `try` block or something like `throw new Error('Message');`

```tsx
// error.tsx example
'use client'
import { useEffect } from "react";

export default function Error({ error, reset }:
    { error: Error & { digest?: string }, reset: () => void }
) {
    useEffect(() => {
        // Optionally log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <main className="flex h-full flex-col items-center justify-center">
            <h2 className="text-center">Something went wrong!</h2>
            <button
                className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
                onClick={
                    // Attempt to recover by trying to re-render the invoices route
                    () => reset()
                }
            >
                Try again
            </button>
        </main>
    );
}
```

* 404 errors, `notFound Function` and `not-found.tsx` => While error.tsx is useful for catching all errors, notFound can be used when you try to fetch a resource that doesn't exist. Note, `notFound()` call will not work with `throw new Error("")`. throw error will call/render the `error.tsx`. Usually notFound is called manually, (`if (condition) notFound()`)

`NotFound()` is a reserved component name to use in `not-found.tsx`, like Page, Error, Layout etc

```tsx
if (!invoice) {
  notFound();
}

// will trigger not-found.tsx, Demo 
export default function NotFound() {
  return (
    <main className="flex h-full flex-col">
      <h2 className="text-xl font-semibold">404 Not Found</h2>
      <p>Could not find the requested invoice.</p>
     </main>
  );
}
```

### Accessibility in NextJS App:
Overall accessibility improvement focus on keyboard navigation, semantic HTML (<input>, <option>, etc instead of <div>), `label` and `htmlfor`, Focus Outline, images `alt` and `for` attributes, colors, videos, etc. For comprehensive guide on this topic can be found here https://web.dev/learn/accessibility/.


* `eslint-plugin-jsx-ally` plugin is included by default with NextJS, which provide warning on accessibility issues on topics like `image alt text` and `role` attribute, ect. On development mode eslint catch errors automatically (as configured by NextJS)

* Running `eslint-plugin-jsx-ally` => as its built into NextJS, use next to call it. Add cmd inside scripts as `"lint": "next lint"` -> `npm init @eslint/config` to create config file `.eslintrc.json` (or add manually), modify config file as necessary and run `npm run link`.

* eslint => https://eslint.org/docs/latest/use/getting-started

```json
// example .eslintrc.json file with next js
{
    "extends": "next/core-web-vitals",
    "rules": {
        "semi": ["warn", "always"],
        "quotes": ["warn", "double"] // can be `off` and `error` also
    }
}
```

### Client Side (browser) validation using `required` inside `input` tag:
```jsx
<input
  ...
  required
/>
```

### Server Side Form Validation:

### `useFormState` to handle form error:
Takes two arguments, (action, initialState), where action is the form's `server actions` and returns [state, dispatch] to form state and dispatch a function. 

The module/Component calling the `useFromState` needs to be marked as `use client`, But the `action` function needs to be server side action. So if action fn is defined inside of a Client Component, it should declare `'use server'` inside of its code block.

```tsx
'use client'

export default function Form({ customers }: { customers: CustomerField[] }) {
  const initialState: State = { message: null, errors: {} };
  const [state, dispatch] = useFormState(createInvoice, initialState);
  return (
    <form action={dispatch}>
      <div className="mb-4">
        <label htmlFor="amount">
          Choose an amount
        </label>
        <div>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            placeholder="Enter USD amount"
            aria-describedby="customer-error" />
        </div>
        <div id="invoice-error" aria-live="polite" aria-atomic="true">
          {state.errors?.amount && state.errors?.amount.map((error: string) => (
            <p className="mt-2 text-sm text-red-500" key={error}>
              {error}
            </p>
          ))}
        </div>
      </div>
    </form>
  )
}

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({invalid_type_error: 'Please select a customer.',}),
  amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {invalid_type_error: 'Please select an invoice status.',}),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true }) // removing id & date prop for now

export async function createInvoice(prevState: State, formData: FormData): Promise<State> {
  'use server'

  // safeParse will return either a `success` or `error`
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
  INSERT INTO invoices (customer_id, amount, status, date)
  VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices')
}
```

### User Authentication and `NextAuth.js` (becomes `Auth.js`):
`authentication` checks who you are, and `authorization` determines what you can do or access in the application.

`NextAuth.js` is NextJS specific authentication library that abstracts away much of the complexity involved in managing sessions, sign-in and sign-out, and other aspects of authentication. Install it with `npm install next-auth@beta` (doesn't come by default). Also generate a secret key for cookie encryption by running `openssl rand -base64 32` shell and copy that in `.env` file

* Note: So try manual session based authentication and also token based (JWT)


- NextAuth workflow: in project root, `auth.config.ts` to store configuration (callback to authorize user), `middleware.ts` to restrict page request access if not logged in and redirect to login page (will use the exported `auth.config`). `auth.ts` will also use the config and will add providers to do the Authentication and export auth, signIn, signOut handle to call from different parts of the app

* NextAuth.js integration process

- create login route to show form at `/login/page.tsx` for user input verification

- create `auth.config.ts` at project root to specify singIn route and `middleware` to restrict user if not authorized for certain pages.

- create `middleware.ts` at project root (export NextAuth with AuthConfig and config/matcher). The advantage of employing Middleware for this task is that the protected routes will not even start rendering until the Middleware verifies the authentication

  * Note => `middleware.ts` runs before request is completed (also before caching and route match) and modify the request and/or responses. See https://nextjs.org/docs/app/building-your-application/routing/middleware


- create `auth.ts` (main script for authentication computation) at project root to spreads authConfig object (to do some Nodejs specific task, like match password hash). Also add `Credential Provider` (`OAuth` or `Email` or Plain Credential form `'next-auth/providers/credentials'`) and add the sign in functionality from there.

OAuth (With Github Guide) -> https://authjs.dev/getting-started/providers/oauth-tutorial. There are other OAuth Provider, like Google, Facebook, Twitter ect.
Email -> https://authjs.dev/getting-started/providers/email-tutorial
Auth.js (Formerly NextAuth.js) => https://authjs.dev/getting-started/introduction

- add server action which will handle login-form submission with formData for username and password and will send request to `auth.js` signIn method with form data. And throw error if failed. For Auth.js error type, see https://next-auth.js.org/errors.

```ts
// auth.config.ts
import type { NextAuthConfig } from 'next-auth';
 
// build an auth config to use by `middleware.ts` and `auth.ts`
export const authConfig = {
  pages: {
    signIn: '/login', // if the callback block return false, redirect to this page
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if(isLoggedIn) return true;
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to the specified url listed in pages 
      } else if (isLoggedIn) {
        console.log("I'm there :", nextUrl)
        return Response.redirect(new URL('/dashboard',nextUrl)); // will redirect after login
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for-now
} satisfies NextAuthConfig;

// satisfies is typescript's type inference feature. Here it check and ensure ts compiler that `it is NextAuthConfig Object`

// middleware.ts
export default NextAuth(authConfig).auth; // checking if authConfig coitions are satisfied or not, and do necessary steeps
export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};

// auth.ts
async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User>`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
 
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

          if (parsedCredentials.success) {
            const { email, password } = parsedCredentials.data;
            const user = await getUser(email);
            if (!user) return null;

            const passwordsMatch = await bcrypt.compare(password, user.password);
            if (passwordsMatch) return user;
          }
          console.log('Invalid credentials');
          return null;
      },
    }),
  ],
});
```

### MetaDta API:
With NextJS's MetaData API, there are two ways to define/add metadata.

1. Config Based: Export a static metadata object or a dynamic generateMetadata function in a layout.js or page.js file.

2. File-based: a range of special files
  - favicon.ico, apple-icon.jpg, and icon.jpg -> Utilized for favicons and icons
  - `opengraph-image.jpg` and `twitter-image.jpg` -> Employed for social media images
  - robots.txt for search engine crawling
  - sitemap.xml: Offers information about the website's structure

* There are flexibility to use these files for static metadata, or you can generate them programmatically (like using NextJS's `ImageResponse` constructor to generate dynamic images using JSX and CSS)

### Favicon and Open Graph (OG) images:
`favicon.ico` and `opengraph-image.jpg` will be automatically picked form `/app` directory. 

* dynamic OG images (JSX + CSS) can be created using the ImageResponse constructor. https://nextjs.org/docs/app/api-reference/functions/image-response

### Page title and description MetaData:
Any metadata (`metadata object`) in layout.js will be inherited by all pages that use it. `page.js` can also have this object.

```tsx
import { Metadata } from 'next';
 
// will be picked up automatically by NextJS 
export const metadata: Metadata = {
  title: 'Acme Dashboard',
  description: 'The official Next.js Course Dashboard, built with App Router.'
};
 
export default function RootLayout() {
  // ....
}
```

* `metadata template` for re-usable meta data across app with placeholder to fill by child page.tsx

```tsx
// `/app/layout.tsx`
import { Metadata } from 'next';

// %s for placeholder string
export const metadata: Metadata = {
  title: {
    template: '%s | Acme Dashboard',
    default: 'Acme Dashboard',
  },
  description: 'The official Next.js Learn Dashboard built with App Router.',
  metadataBase: new URL('https://next-learn-dashboard.vercel.sh'),
};

// `/app/someOtherDirectory/page.tsx
export const metadata: Metadata = {
  title: 'Invoices',
};
```