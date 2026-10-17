import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  booking_id: z.string().uuid(),
  payment_method: z
    .enum(['VIETQR', 'BANK_TRANSFER', 'PAY_AT_HOTEL'])
    .default('VIETQR'),
  contact: z.string().optional(),
});

export type CreatePaymentIntentDto = z.infer<typeof createPaymentIntentSchema>;

export const confirmPaymentSchema = z
  .object({
    booking_id: z.string().uuid().optional(),
    transaction_ref: z.string().optional(),
  })
  .refine(
    (data) => Boolean(data.booking_id) !== Boolean(data.transaction_ref),
    {
      message: 'Chỉ cung cấp một trong booking_id hoặc transaction_ref',
    },
  );

export type ConfirmPaymentDto = z.infer<typeof confirmPaymentSchema>;
