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

### DB query:
Database query can be done using RAW `SQL` or `noSQL` or Using a ORM like `Prisma`. DB query should be done from server component, not from client anyway.

Fetching data with Server Components don't require useEffect, useState or data fetching libraries and can be done directly using `async/await` and `Promise API`.