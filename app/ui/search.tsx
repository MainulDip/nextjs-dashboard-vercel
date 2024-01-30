'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export default function Search({ placeholder }: { placeholder: string }) {

  console.log("rerendering Page() in dashboard/invoice, logging from client")
  // note, changing browser url (using replace:useRouter) will rerender the Page() component

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const {replace} = useRouter();

  const debounceCall = useDebouncedCallback((v)=>handleClick(v),1000)

  function handleClick(term: string) {
    const params = new URLSearchParams(searchParams)
    if(term) {
      params.set('query', term)
    } else {
      params.delete('query')
    }

    const urlRoute = `${pathname}?${params.toString()}`

    replace('/dashboard') // updates the URL with the user's search data without reloading the page

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
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        onChange={(e) => debounceCall(e.target.value)}
        defaultValue={searchParams.get('query')?.toString()} // will persist input field on page refresh/reload
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
