'use server';

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

  // clear cache --forced, as NextJS imply caches through `Client-side Router Cache` that store the route segments in browser
  // with prefetching technique. revalidatePath('route') will force clear cache and trigger db query on that specified route.
  revalidatePath('/dashboard/invoices'); // also it will re-render/re-compose the route specified, which will update UI Screen

  redirect('/dashboard/invoices') // triggering a redirect to the updated page. Where updates are applied ahead of time already
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

  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Update Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {


  // throw new Error('Failed to Delete Invoice');

  try {
    await sql`
    DELETE FROM invoices
    WHERE id = ${id}
  `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Delete Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices'); // will clear cache, re-render the route and update UI screen
}