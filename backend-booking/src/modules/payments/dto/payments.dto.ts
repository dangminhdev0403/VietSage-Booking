import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  booking_id: z.string().uuid(),
  payment_method: z
    .enum(['VIETQR', 'BANK_TRANSFER', 'PAY_AT_HOTEL', 'STRIPE_LOCALMATE'])
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

export const createDepositCheckoutSchema = z.object({
  booking_code: z.string().min(1, 'Mã đặt phòng không được để trống'),
  lookup_token: z.string().optional(),
  return_url: z.string().url().optional(),
});

export type CreateDepositCheckoutDto = z.infer<
  typeof createDepositCheckoutSchema
>;

export const verifyCheckoutSchema = z.object({
  booking_code: z.string().min(1, 'Mã đặt phòng không được để trống'),
  session_id: z.string().optional(),
  lookup_token: z.string().optional(),
});

export type VerifyCheckoutDto = z.infer<typeof verifyCheckoutSchema>;
