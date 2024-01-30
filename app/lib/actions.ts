'use server';
 
export async function createInvoice(formData: FormData) {
  const rawFormData = {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  };

  // const rawFormData = Object.fromEntries(formData.entries()) // concise way to extract form data
  // Test it out:
  console.log(rawFormData);
}