'use server';

import { z } from "zod";
// import { CreateInvoice } from '../ui/invoices/buttons';
// import { createInvoice } from '@/app/lib/actions';
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

// export async function createInvoice(formData: FormData) {
//   const rawFormData = {
//     customerId: formData.get('customerId'),
//     amount: formData.get('amount'),
//     status: formData.get('status'),
//   };

//   // const rawFormData = Object.fromEntries(formData.entries()) // concise way to extract form data

//   console.log(rawFormData);
// /*
//   {
//     customerId: '50ca3e18-62cd-11ee-8c99-0242ac120002',
//     amount: '',
//     status: null
//   }
// */
// }

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  
  const amountInCents = amount * 100;
 
  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}