import {
  BadRequestException,
  ConflictException,
  GatewayTimeoutException,
  Injectable,
  Logger,
  NotImplementedException,
} from '@nestjs/common';
import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { Prisma, SyncStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateHoldParams {
  hotelId: string;
  roomTypeId: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  roomsCount?: number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  idempotencyKey?: string;
  operationKey?: string;
  ttlMinutes?: number; // default 15
}

export interface HoldResult {
  holdId: string;
  status: 'HELD';
  hotelId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  roomsCount: number;
  expiresAt: string;
}

export interface ConfirmHoldParams {
  holdId: string;
  bookingId: string;
  idempotencyKey?: string;
  operationKey?: string;
}

export interface ConfirmHoldResult {
  reservationId: string;
  reservationCode: string;
  holdId: string;
  bookingId: string;
  status: 'CONFIRMED';
  roomStatus: 'RESERVED' | 'UNASSIGNED';
  confirmedAt: string;
}

export interface ReleaseHoldParams {
  holdId: string;
  reason?: string;
  idempotencyKey?: string;
}

export interface ReleaseHoldResult {
  holdId: string;
  status: 'RELEASED';
  releasedAt: string;
}

export interface ReconcileResult {
  reconciled: boolean;
  status: string;
  reservationId?: string;
  result?: ConfirmHoldResult;
  error?: string;
}

export interface SignRequestOptions {
  method: string;
  path: string;
  timestamp: number;
  requestId: string;
  body: unknown;
  secret: string;
}

export interface VerifySignatureOptions {
  method: string;
  path: string;
  timestamp?: number;
  requestId: string;
  body: unknown;
  signatureHeader: string;
  secret: string;
  toleranceSeconds?: number;
  currentTimestamp?: number;
}

interface PmsHoldResponse {
  data?: {
    hold_id?: string;
    id?: string;
    expires_at?: string;
  };
  hold_id?: string;
  id?: string;
  expires_at?: string;
}

interface PmsConfirmResponse {
  data?: {
    reservation_id?: string;
    id?: string;
    reservation_code?: string;
    code?: string;
    room_status?: string;
    roomStatus?: string;
    confirmed_at?: string;
  };
  reservation_id?: string;
  id?: string;
  reservation_code?: string;
  code?: string;
  room_status?: string;
  roomStatus?: string;
  confirmed_at?: string;
}

interface PmsStatusResponse {
  data?: {
    confirmed?: boolean;
    reservation_id?: string;
    id?: string;
    reservation_code?: string;
    code?: string;
    room_status?: string;
    hold_status?: string;
    confirmed_at?: string;
  };
  confirmed?: boolean;
  reservation_id?: string;
  id?: string;
  reservation_code?: string;
  code?: string;
  room_status?: string;
  hold_status?: string;
  confirmed_at?: string;
}

export function computeCanonicalPayload(
  method: string,
  path: string,
  timestamp: number,
  requestId: string,
  body: unknown,
): string {
  const bodyString =
    body === null || body === undefined
      ? ''
      : typeof body === 'string'
        ? body
        : JSON.stringify(body);
  const bodyHash = createHash('sha256')
    .update(bodyString, 'utf8')
    .digest('hex');
  return `${method.toUpperCase()}\n${path}\n${timestamp}\n${requestId}\n${bodyHash}`;
}

export function signHmacPayload(canonical: string, secret: string): string {
  return createHmac('sha256', secret).update(canonical, 'utf8').digest('hex');
}

export function verifyHmacSignature(options: VerifySignatureOptions): {
  verified: boolean;
  timestamp: number;
} {
  const {
    method,
    path,
    timestamp: explicitTimestamp,
    requestId,
    body,
    signatureHeader,
    secret,
    toleranceSeconds = 300,
    currentTimestamp = Math.floor(Date.now() / 1000),
  } = options;

  if (!secret || secret.trim().length === 0) {
    throw new BadRequestException('VietSage HMAC secret is not configured');
  }

  if (!signatureHeader || signatureHeader.trim().length === 0) {
    throw new BadRequestException('Missing VietSage signature header');
  }

  let timestamp = explicitTimestamp;
  const candidateSignatures: string[] = [];

  if (signatureHeader.includes('v1=')) {
    const parts = signatureHeader.split(',');
    for (const part of parts) {
      const [key, ...valParts] = part.trim().split('=');
      const val = valParts.join('=');
      if (key === 't') {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed)) {
          timestamp = parsed;
        }
      } else if (key === 'v1' && val.length > 0) {
        candidateSignatures.push(val);
      }
    }
  } else {
    candidateSignatures.push(signatureHeader.trim());
  }

  if (timestamp === undefined || isNaN(timestamp)) {
    throw new BadRequestException(
      'Missing or invalid timestamp for VietSage signature verification',
    );
  }

  const drift = Math.abs(currentTimestamp - timestamp);
  if (drift > toleranceSeconds) {
    throw new BadRequestException(
      'VietSage request timestamp drift exceeds tolerance window',
    );
  }

  const canonical = computeCanonicalPayload(
    method,
    path,
    timestamp,
    requestId,
    body,
  );
  const expectedHex = signHmacPayload(canonical, secret);
  const expectedBuffer = Buffer.from(expectedHex, 'hex');

  for (const candidate of candidateSignatures) {
    try {
      const candidateBuffer = Buffer.from(candidate, 'hex');
      if (
        candidateBuffer.length === expectedBuffer.length &&
        timingSafeEqual(candidateBuffer, expectedBuffer)
      ) {
        return { verified: true, timestamp };
      }
    } catch {
      // Continue checking other candidates
    }
  }

  throw new BadRequestException('VietSage HMAC signature verification failed');
}

@Injectable()
export class VietSageSyncService {
  private readonly logger = new Logger(VietSageSyncService.name);

  private readonly baseUrl: string =
    process.env.VIETSAGE_API_BASE_URL || 'http://localhost:4000/api/v1';

  private readonly hmacSecret: string =
    process.env.VIETSAGE_HMAC_SECRET ||
    process.env.VIETSAGE_PARTNER_API_KEY ||
    'vietsage_dev_partner_secret';

  private httpClient: (url: string, init?: RequestInit) => Promise<Response> = (
    url,
    init,
  ) => globalThis.fetch(url, init);

  constructor(private readonly prisma: PrismaService) {}

  setHttpClient(
    client: (url: string, init?: RequestInit) => Promise<Response>,
  ): void {
    this.httpClient = client;
  }

  /**
   * Helper to sign an outgoing HTTP request with HMAC SHA256.
   */
  signRequest(
    method: string,
    path: string,
    body: unknown,
    idempotencyKey?: string,
  ): {
    headers: Record<string, string>;
    timestamp: number;
    requestId: string;
    signature: string;
  } {
    const timestamp = Math.floor(Date.now() / 1000);
    const requestId = randomUUID();
    const canonical = computeCanonicalPayload(
      method,
      path,
      timestamp,
      requestId,
      body,
    );
    const signature = signHmacPayload(canonical, this.hmacSecret);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Signature': `t=${timestamp},v1=${signature}`,
      'X-Signature-V1': signature,
      'X-Timestamp': String(timestamp),
      'X-Request-Id': requestId,
    };

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    return { headers, timestamp, requestId, signature };
  }

  /**
   * Create an inventory hold in VietSage PMS.
   * Atomically checks availability and locks allotment.
   */
  async createHold(params: CreateHoldParams): Promise<HoldResult> {
    if (!params.hotelId || !params.roomTypeId) {
      throw new BadRequestException(
        'hotelId và roomTypeId là bắt buộc khi tạo hold',
      );
    }
    if (!params.checkInDate || !params.checkOutDate) {
      throw new BadRequestException('checkInDate và checkOutDate là bắt buộc');
    }
    if (params.checkOutDate <= params.checkInDate) {
      throw new BadRequestException(
        'checkOutDate phải sau checkInDate theo khoảng nửa mở [check_in, check_out)',
      );
    }

    const idempotencyKey = params.idempotencyKey || randomUUID();
    const operationKey =
      params.operationKey ||
      `hold:${params.hotelId}:${params.roomTypeId}:${params.checkInDate}:${params.checkOutDate}:${idempotencyKey}`;

    // Check existing durable log for idempotent replay
    const existingLog = await this.prisma.vietSageSyncLog.findUnique({
      where: { operationKey },
    });
    if (
      existingLog &&
      existingLog.status === SyncStatus.SUCCESS &&
      existingLog.response
    ) {
      return existingLog.response as unknown as HoldResult;
    }

    const path = '/channel-manager/direct-booking/holds';
    const payload = {
      hotel_id: params.hotelId,
      room_type_id: params.roomTypeId,
      check_in_date: params.checkInDate,
      check_out_date: params.checkOutDate,
      rooms_count: params.roomsCount ?? 1,
      guest: {
        name: params.guestName || 'OTA Guest',
        email: params.guestEmail || '',
        phone: params.guestPhone || '',
      },
      ttl_minutes: params.ttlMinutes ?? 15,
    };

    const { headers } = this.signRequest('POST', path, payload, idempotencyKey);
    const url = `${this.baseUrl}${path}`;

    try {
      const response = await this.httpClient(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 409) {
          await this.prisma.vietSageSyncLog.upsert({
            where: { operationKey },
            create: {
              operationKey,
              idempotencyKey,
              syncType: 'direct_booking_hold',
              direction: 'OUTBOUND',
              status: SyncStatus.FAILED,
              attemptCount: 1,
              error: 'ROOM_NOT_AVAILABLE',
            },
            update: {
              status: SyncStatus.FAILED,
              error: 'ROOM_NOT_AVAILABLE',
            },
          });
          throw new ConflictException(
            'Phòng không còn khả dụng trên VietSage PMS',
          );
        }
        throw new BadRequestException(
          `VietSage hold creation error: ${errorText}`,
        );
      }

      const json = (await response.json()) as PmsHoldResponse;
      const pmsData = json.data ?? json;

      const holdResult: HoldResult = {
        holdId: pmsData.hold_id ?? pmsData.id ?? '',
        status: 'HELD',
        hotelId: params.hotelId,
        roomTypeId: params.roomTypeId,
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
        roomsCount: params.roomsCount ?? 1,
        expiresAt:
          pmsData.expires_at ??
          new Date(
            Date.now() + (params.ttlMinutes ?? 15) * 60000,
          ).toISOString(),
      };

      await this.prisma.vietSageSyncLog.upsert({
        where: { operationKey },
        create: {
          operationKey,
          idempotencyKey,
          syncType: 'direct_booking_hold',
          direction: 'OUTBOUND',
          status: SyncStatus.SUCCESS,
          attemptCount: 1,
          response: holdResult as unknown as Prisma.InputJsonValue,
        },
        update: {
          status: SyncStatus.SUCCESS,
          response: holdResult as unknown as Prisma.InputJsonValue,
          error: null,
        },
      });

      return holdResult;
    } catch (err: unknown) {
      if (
        err instanceof ConflictException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Timeout or network error creating hold on VietSage for operation ${operationKey}: ${message}`,
      );
      await this.prisma.vietSageSyncLog.upsert({
        where: { operationKey },
        create: {
          operationKey,
          idempotencyKey,
          syncType: 'direct_booking_hold',
          direction: 'OUTBOUND',
          status: SyncStatus.PENDING,
          attemptCount: 1,
          error: 'TIMEOUT_AFTER_WRITE',
        },
        update: {
          attemptCount: { increment: 1 },
          error: 'TIMEOUT_AFTER_WRITE',
        },
      });
      throw new GatewayTimeoutException(
        'VietSage hold request timed out. Operation marked PENDING for reconciliation.',
      );
    }
  }

  /**
   * Confirm an existing inventory hold in VietSage PMS.
   * Consumes the hold and creates/returns a CONFIRMED PMS reservation.
   *
   * Invariant:
   * When reservation is confirmed, hold is consumed and allotment is reduced/held in ARI,
   * but room status MUST NEVER be set to OCCUPIED (it remains unassigned or RESERVED until PMS check-in).
   */
  async confirmHold(
    holdIdOrParams: string | ConfirmHoldParams,
    maybeBookingId?: string,
    maybeIdempotencyKey?: string,
  ): Promise<ConfirmHoldResult> {
    const holdId =
      typeof holdIdOrParams === 'string'
        ? holdIdOrParams
        : holdIdOrParams.holdId;
    const bookingId =
      typeof holdIdOrParams === 'string'
        ? maybeBookingId!
        : holdIdOrParams.bookingId;
    const idempotencyKey =
      (typeof holdIdOrParams === 'object'
        ? holdIdOrParams.idempotencyKey
        : maybeIdempotencyKey) || `confirm-hold:${holdId}:${bookingId}`;
    const operationKey =
      (typeof holdIdOrParams === 'object'
        ? holdIdOrParams.operationKey
        : undefined) || `confirm-hold:${holdId}:${bookingId}`;

    if (!holdId || !bookingId) {
      throw new BadRequestException(
        'holdId và bookingId là bắt buộc khi xác nhận hold',
      );
    }

    // Check existing durable log for idempotent replay
    const existingLog = await this.prisma.vietSageSyncLog.findUnique({
      where: { operationKey },
    });
    if (
      existingLog &&
      existingLog.status === SyncStatus.SUCCESS &&
      existingLog.response
    ) {
      return existingLog.response as unknown as ConfirmHoldResult;
    }

    // If log was previously PENDING with timeout-after-write, attempt reconciliation first
    if (
      existingLog &&
      existingLog.status === SyncStatus.PENDING &&
      existingLog.error === 'TIMEOUT_AFTER_WRITE'
    ) {
      const recon = await this.reconcileOperation(operationKey);
      if (recon.reconciled && recon.status === 'CONFIRMED' && recon.result) {
        return recon.result;
      }
    }

    // Upsert durable operation log as PENDING before mutation
    await this.prisma.vietSageSyncLog.upsert({
      where: { operationKey },
      create: {
        operationKey,
        idempotencyKey,
        bookingId,
        syncType: 'direct_booking_confirm_hold',
        direction: 'OUTBOUND',
        status: SyncStatus.PENDING,
        attemptCount: 1,
        payload: { holdId, bookingId },
      },
      update: {
        attemptCount: { increment: 1 },
      },
    });

    const path = `/channel-manager/direct-booking/holds/${holdId}/confirm`;
    const payload = {
      hold_id: holdId,
      booking_id: bookingId,
    };

    const { headers } = this.signRequest('POST', path, payload, idempotencyKey);
    const url = `${this.baseUrl}${path}`;

    try {
      const response = await this.httpClient(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        await this.prisma.vietSageSyncLog.update({
          where: { operationKey },
          data: {
            status: SyncStatus.FAILED,
            error: errorText.slice(0, 500),
          },
        });
        throw new BadRequestException(
          `VietSage hold confirmation failed (${response.status}): ${errorText}`,
        );
      }

      const json = (await response.json()) as PmsConfirmResponse;
      const pmsData = json.data ?? json;

      // Invariant assertion: Room status must NEVER be set to OCCUPIED prior to check-in
      const rawRoomStatus = (
        pmsData.room_status ??
        pmsData.roomStatus ??
        'RESERVED'
      ).toUpperCase();
      if (rawRoomStatus === 'OCCUPIED') {
        this.logger.error(
          `INVARIANT VIOLATION: VietSage returned OCCUPIED room status for hold confirmation of booking ${bookingId}.`,
        );
        throw new ConflictException(
          'INVARIANT_VIOLATION: Room status cannot be OCCUPIED prior to actual guest check-in.',
        );
      }

      const confirmResult: ConfirmHoldResult = {
        reservationId:
          pmsData.reservation_id ??
          pmsData.id ??
          `pms-res-${randomUUID().slice(0, 8)}`,
        reservationCode:
          pmsData.reservation_code ??
          pmsData.code ??
          `VS-${bookingId.slice(0, 8).toUpperCase()}`,
        holdId,
        bookingId,
        status: 'CONFIRMED',
        roomStatus: rawRoomStatus === 'UNASSIGNED' ? 'UNASSIGNED' : 'RESERVED',
        confirmedAt: pmsData.confirmed_at ?? new Date().toISOString(),
      };

      await this.prisma.vietSageSyncLog.update({
        where: { operationKey },
        data: {
          status: SyncStatus.SUCCESS,
          response: confirmResult as unknown as Prisma.InputJsonValue,
          error: null,
        },
      });

      return confirmResult;
    } catch (err: unknown) {
      if (
        err instanceof ConflictException ||
        (err instanceof BadRequestException &&
          !err.message.includes('fetch failed'))
      ) {
        throw err;
      }

      // Timeout-after-write handling: mark error and execute reconciliation
      this.logger.warn(
        `Timeout-after-write confirming hold ${holdId} for booking ${bookingId}. Triggering reconciliation...`,
      );
      await this.prisma.vietSageSyncLog.update({
        where: { operationKey },
        data: {
          error: 'TIMEOUT_AFTER_WRITE',
        },
      });

      const recon = await this.reconcileOperation(operationKey);
      if (recon.reconciled && recon.status === 'CONFIRMED' && recon.result) {
        return recon.result;
      }

      throw new GatewayTimeoutException(
        'VietSage hold confirmation timed out after dispatch. Operation is durable and pending reconciliation.',
      );
    }
  }

  /**
   * Release an inventory hold in VietSage PMS.
   */
  async releaseHold(
    holdId: string,
    reason = 'EXPIRED_OR_CANCELLED',
    idempotencyKey?: string,
  ): Promise<ReleaseHoldResult> {
    const operationKey = `release-hold:${holdId}`;
    const idKey = idempotencyKey || operationKey;

    const existingLog = await this.prisma.vietSageSyncLog.findUnique({
      where: { operationKey },
    });
    if (
      existingLog &&
      existingLog.status === SyncStatus.SUCCESS &&
      existingLog.response
    ) {
      return existingLog.response as unknown as ReleaseHoldResult;
    }

    const path = `/channel-manager/direct-booking/holds/${holdId}/release`;
    const payload = {
      hold_id: holdId,
      reason,
    };

    const { headers } = this.signRequest('POST', path, payload, idKey);
    const url = `${this.baseUrl}${path}`;

    try {
      const response = await this.httpClient(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new BadRequestException(
          `VietSage hold release failed: ${errorText}`,
        );
      }

      const releaseResult: ReleaseHoldResult = {
        holdId,
        status: 'RELEASED',
        releasedAt: new Date().toISOString(),
      };

      await this.prisma.vietSageSyncLog.upsert({
        where: { operationKey },
        create: {
          operationKey,
          idempotencyKey: idKey,
          syncType: 'direct_booking_release_hold',
          direction: 'OUTBOUND',
          status: SyncStatus.SUCCESS,
          attemptCount: 1,
          response: releaseResult as unknown as Prisma.InputJsonValue,
        },
        update: {
          status: SyncStatus.SUCCESS,
          response: releaseResult as unknown as Prisma.InputJsonValue,
          error: null,
        },
      });

      return releaseResult;
    } catch (err: unknown) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Error releasing hold ${holdId} on VietSage: ${message}`,
      );
      await this.prisma.vietSageSyncLog.upsert({
        where: { operationKey },
        create: {
          operationKey,
          idempotencyKey: idKey,
          syncType: 'direct_booking_release_hold',
          direction: 'OUTBOUND',
          status: SyncStatus.FAILED,
          attemptCount: 1,
          error: message,
        },
        update: {
          status: SyncStatus.FAILED,
          error: message,
        },
      });
      throw err;
    }
  }

  /**
   * Reconcile a pending or timed-out operation with VietSage PMS.
   */
  async reconcileOperation(operationKey: string): Promise<ReconcileResult> {
    const log = await this.prisma.vietSageSyncLog.findUnique({
      where: { operationKey },
    });

    if (!log) {
      return {
        reconciled: false,
        status: 'NOT_FOUND',
        error: 'Operation key not found in sync logs',
      };
    }

    if (log.status === SyncStatus.SUCCESS) {
      const res = log.response as unknown as ConfirmHoldResult;
      return {
        reconciled: true,
        status: 'CONFIRMED',
        reservationId: res?.reservationId,
        result: res,
      };
    }

    if (log.syncType === 'direct_booking_confirm_hold') {
      const bookingId = log.bookingId || '';
      const path = `/channel-manager/direct-booking/status?operation_key=${encodeURIComponent(
        operationKey,
      )}&booking_id=${encodeURIComponent(bookingId)}`;
      const { headers } = this.signRequest('GET', path, null);
      const url = `${this.baseUrl}${path}`;

      try {
        const response = await this.httpClient(url, {
          method: 'GET',
          headers,
        });

        if (response.ok) {
          const json = (await response.json()) as PmsStatusResponse;
          const pmsData = json.data ?? json;

          if (pmsData.confirmed && (pmsData.reservation_id || pmsData.id)) {
            const reservationId = pmsData.reservation_id ?? pmsData.id ?? '';
            const payloadObj = log.payload as { holdId?: string } | null;
            const confirmResult: ConfirmHoldResult = {
              reservationId,
              reservationCode:
                pmsData.reservation_code ??
                pmsData.code ??
                `VS-${bookingId.slice(0, 8).toUpperCase()}`,
              holdId: payloadObj?.holdId ?? '',
              bookingId,
              status: 'CONFIRMED',
              roomStatus:
                pmsData.room_status === 'UNASSIGNED'
                  ? 'UNASSIGNED'
                  : 'RESERVED',
              confirmedAt: pmsData.confirmed_at ?? new Date().toISOString(),
            };

            await this.prisma.vietSageSyncLog.update({
              where: { operationKey },
              data: {
                status: SyncStatus.SUCCESS,
                response: confirmResult as unknown as Prisma.InputJsonValue,
                error: null,
              },
            });

            return {
              reconciled: true,
              status: 'CONFIRMED',
              reservationId,
              result: confirmResult,
            };
          }

          if (
            pmsData.hold_status === 'RELEASED' ||
            pmsData.hold_status === 'EXPIRED'
          ) {
            await this.prisma.vietSageSyncLog.update({
              where: { operationKey },
              data: {
                status: SyncStatus.FAILED,
                error: 'HOLD_EXPIRED_OR_RELEASED',
              },
            });

            return {
              reconciled: true,
              status: 'FAILED',
              error: 'HOLD_EXPIRED_OR_RELEASED',
            };
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Reconciliation query failed for operation ${operationKey}: ${message}`,
        );
      }
    }

    return {
      reconciled: false,
      status: log.status,
      error: 'STILL_PENDING',
    };
  }

  /**
   * Legacy / Admin sync endpoints (Fail closed)
   */
  syncFromVietSage(syncType = 'all'): Promise<never> {
    this.logger.warn(
      `VietSage sync requested for type: ${syncType}, but adapter runtime is not configured.`,
    );

    return Promise.reject(
      new NotImplementedException(
        'Tính năng đồng bộ VietSage PMS chưa được kích hoạt: runtime connector/adapter chưa được cấu hình.',
      ),
    );
  }

  pushBookingToVietSage(bookingId: string): Promise<never> {
    this.logger.warn(
      `Push booking ${bookingId} to VietSage rejected: runtime connector not configured.`,
    );

    return Promise.reject(
      new NotImplementedException(
        'Tính năng đẩy đơn đặt phòng sang VietSage chưa được kích hoạt: runtime connector/adapter chưa được cấu hình.',
      ),
    );
  }
}
