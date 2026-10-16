export type ApiSuccessEnvelope<TData, TMeta = Record<string, unknown>> = {
  success: true;
  data: TData;
  meta?: TMeta;
};

export type ApiErrorEnvelope<TDetails = unknown> = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: TDetails;
  };
  request_id?: string;
};

export function ok<TData>(data: TData): ApiSuccessEnvelope<TData>;
export function ok<TData, TMeta>(
  data: TData,
  meta: TMeta,
): ApiSuccessEnvelope<TData, TMeta>;
export function ok<TData, TMeta>(
  data: TData,
  meta?: TMeta,
): ApiSuccessEnvelope<TData, TMeta> {
  return meta === undefined
    ? { success: true, data }
    : { success: true, data, meta };
}

export function fail<TDetails>(
  code: string,
  message: string,
  details?: TDetails,
  requestId?: string,
): ApiErrorEnvelope<TDetails> {
  const envelope: ApiErrorEnvelope<TDetails> = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details !== undefined) {
    envelope.error.details = details;
  }

  if (requestId !== undefined) {
    envelope.request_id = requestId;
  }

  return envelope;
}
