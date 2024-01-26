### API Endpoints | Route Handlers:
Route Handlers are defined in a route.js|ts file inside the app directory. They are the equivalent of API Routes inside the pages directory but both will not work together.
```ts
// app/api/route.ts
export const dynamic = 'force-dynamic' // defaults to auto
export async function GET(request: Request) {}
```