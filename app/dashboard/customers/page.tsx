export default async function Page() {
    await new Promise<void>((resolve) => setTimeout(()=>resolve(), 400));
    return (<p>Customers Page</p>)
}