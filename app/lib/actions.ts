'use server';

import { z } from "zod";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});
 
export async function createInvoice(formData: FormData) {
  const rawFormData = {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  };

  // const rawFormData = Object.fromEntries(formData.entries()) // concise way to extract form data

  console.log(rawFormData);
/*
  {
    customerId: '50ca3e18-62cd-11ee-8c99-0242ac120002',
    amount: '',
    status: null
  }
*/
}