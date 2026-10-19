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
import {
  getRuntimeSecret,
  getRuntimeValue,
} from '../../common/config/runtime-config';

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
  // Fallback booking metadata for on-the-fly hold reconstruction on PMS
  hotelId?: string;
  roomTypeId?: string;
  checkInDate?: string;
  checkOutDate?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  amount?: number;
  currency?: string;
}

export interface ConfirmHoldResult {
  reservationId: string;
  reservationCode: string;
  holdId: string;
  bookingId: string;
  status: 'CONFIRMED';
  roomStatus: 'RESERVED' | 'UNASSIGNED';
  assignedRoom?: {
    roomNumber?: string;
    floor?: string | number | null;
  };
  confirmedAt: string;
}

export interface InventoryAdjustmentItem {
  date: string;
  available_rooms?: number;
  total_rooms?: number;
  booked_rooms?: number;
  price?: number;
  is_blocked?: boolean;
}

export interface InventoryUpdatePayload {
  property_id: string;
  room_type_id: string;
  adjustments: InventoryAdjustmentItem[];
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

export interface VietSageRoomCatalogItem {
  name: string;
  normalizedKey: string;
  description: string;
  basePrice: number;
  totalRooms: number;
  maxGuests: number;
  bedType: string;
  areaSqm: number;
  amenities: string[];
  sampleRoomNumbers: string[];
}

export interface VietSageRoomCatalogResult {
  hotelId: string;
  hotelName: string;
  hotelCode: string;
  partnerEmail: string;
  roomTypes: VietSageRoomCatalogItem[];
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
    assigned_room?: {
      room_number?: string;
      roomNumber?: string;
      floor?: string | number | null;
    } | string;
    assignedRoom?: {
      room_number?: string;
      roomNumber?: string;
      floor?: string | number | null;
    } | string;
    room_number?: string;
    roomNumber?: string;
  };
  reservation_id?: string;
  id?: string;
  reservation_code?: string;
  code?: string;
  room_status?: string;
  roomStatus?: string;
  confirmed_at?: string;
  assigned_room?: {
    room_number?: string;
    roomNumber?: string;
    floor?: string | number | null;
  } | string;
  assignedRoom?: {
    room_number?: string;
    roomNumber?: string;
    floor?: string | number | null;
  } | string;
  room_number?: string;
  roomNumber?: string;
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
    assigned_room?: {
      room_number?: string;
      roomNumber?: string;
      floor?: string | number | null;
    } | string;
    assignedRoom?: {
      room_number?: string;
      roomNumber?: string;
      floor?: string | number | null;
    } | string;
    room_number?: string;
    roomNumber?: string;
  };
  confirmed?: boolean;
  reservation_id?: string;
  id?: string;
  reservation_code?: string;
  code?: string;
  room_status?: string;
  hold_status?: string;
  confirmed_at?: string;
  assigned_room?: {
    room_number?: string;
    roomNumber?: string;
    floor?: string | number | null;
  } | string;
  assignedRoom?: {
    room_number?: string;
    roomNumber?: string;
    floor?: string | number | null;
  } | string;
  room_number?: string;
  roomNumber?: string;
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

  private readonly baseUrl = getRuntimeValue(
    'VIETSAGE_API_BASE_URL',
    'http://localhost:8080',
  ).replace(/\/$/, '');

  private readonly hmacSecret =
    process.env.VIETSAGE_HMAC_SECRET ||
    process.env.VIETSAGE_PARTNER_API_KEY ||
    'vietsage_ota_partner_secret';

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

      const json = (await response.json()) as any;
      const rawData = json?.data;
      const pmsData =
        typeof rawData === 'object' && rawData !== null && 'data' in rawData
          ? rawData.data
          : (rawData ?? json);

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

    // Build fallback metadata from ConfirmHoldParams for PMS on-the-fly hold reconstruction
    const fallbackHotelId = typeof holdIdOrParams === 'object' ? holdIdOrParams.hotelId : undefined;
    const fallbackRoomTypeId = typeof holdIdOrParams === 'object' ? holdIdOrParams.roomTypeId : undefined;
    const fallbackCheckInDate = typeof holdIdOrParams === 'object' ? holdIdOrParams.checkInDate : undefined;
    const fallbackCheckOutDate = typeof holdIdOrParams === 'object' ? holdIdOrParams.checkOutDate : undefined;
    const fallbackGuestName = typeof holdIdOrParams === 'object' ? holdIdOrParams.guestName : undefined;
    const fallbackGuestEmail = typeof holdIdOrParams === 'object' ? holdIdOrParams.guestEmail : undefined;
    const fallbackGuestPhone = typeof holdIdOrParams === 'object' ? holdIdOrParams.guestPhone : undefined;
    const fallbackAmount = typeof holdIdOrParams === 'object' ? holdIdOrParams.amount : undefined;
    const fallbackCurrency = typeof holdIdOrParams === 'object' ? holdIdOrParams.currency : undefined;

    const payload: Record<string, unknown> = {
      hold_id: holdId,
      booking_id: bookingId,
    };

    // Include fallback booking metadata if available
    if (fallbackHotelId) payload.hotel_id = fallbackHotelId;
    if (fallbackRoomTypeId) payload.room_type_id = fallbackRoomTypeId;
    if (fallbackCheckInDate) payload.check_in_date = fallbackCheckInDate;
    if (fallbackCheckOutDate) payload.check_out_date = fallbackCheckOutDate;
    if (fallbackGuestName || fallbackGuestEmail || fallbackGuestPhone) {
      payload.guest = {
        name: fallbackGuestName || 'OTA Guest',
        email: fallbackGuestEmail || '',
        phone: fallbackGuestPhone || '',
      };
    }
    if (fallbackAmount !== undefined) payload.amount = fallbackAmount;
    if (fallbackCurrency) payload.currency = fallbackCurrency;

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

      const json = (await response.json()) as any;
      const rawData = json?.data;
      const pmsData =
        typeof rawData === 'object' && rawData !== null && 'data' in rawData
          ? rawData.data
          : (rawData ?? json);

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

      let assignedRoom:
        | { roomNumber?: string; floor?: string | number | null }
        | undefined = undefined;
      const rawAssigned = pmsData.assigned_room ?? pmsData.assignedRoom;
      if (typeof rawAssigned === 'object' && rawAssigned !== null) {
        const roomNumber =
          rawAssigned.room_number ??
          rawAssigned.roomNumber ??
          pmsData.room_number ??
          pmsData.roomNumber;
        const floor = rawAssigned.floor ?? null;
        if (roomNumber) {
          assignedRoom = { roomNumber: String(roomNumber), floor };
        }
      } else if (
        typeof rawAssigned === 'string' &&
        rawAssigned.trim().length > 0
      ) {
        assignedRoom = { roomNumber: rawAssigned.trim(), floor: null };
      } else if (pmsData.room_number || pmsData.roomNumber) {
        const roomNumber = pmsData.room_number ?? pmsData.roomNumber;
        assignedRoom = { roomNumber: String(roomNumber), floor: null };
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
        assignedRoom,
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
            let assignedRoom:
              | { roomNumber?: string; floor?: string | number | null }
              | undefined = undefined;
            const rawAssigned = pmsData.assigned_room ?? pmsData.assignedRoom;
            if (typeof rawAssigned === 'object' && rawAssigned !== null) {
              const roomNumber =
                rawAssigned.room_number ??
                rawAssigned.roomNumber ??
                pmsData.room_number ??
                pmsData.roomNumber;
              const floor = rawAssigned.floor ?? null;
              if (roomNumber) {
                assignedRoom = { roomNumber: String(roomNumber), floor };
              }
            } else if (
              typeof rawAssigned === 'string' &&
              rawAssigned.trim().length > 0
            ) {
              assignedRoom = { roomNumber: rawAssigned.trim(), floor: null };
            } else if (pmsData.room_number || pmsData.roomNumber) {
              const roomNumber = pmsData.room_number ?? pmsData.roomNumber;
              assignedRoom = { roomNumber: String(roomNumber), floor: null };
            }

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
              assignedRoom,
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

  getHmacSecret(): string {
    return this.hmacSecret;
  }

  /**
   * Process inbound inventory updates from VietSage PMS webhook.
   */
  async processInventoryAdjustments(payload: InventoryUpdatePayload): Promise<{
    processed: number;
    roomTypeId: string;
  }> {
    if (
      !payload.property_id ||
      !payload.room_type_id ||
      !Array.isArray(payload.adjustments)
    ) {
      throw new BadRequestException('Payload điều chỉnh tồn kho không hợp lệ');
    }

    let targetRoomTypeId = payload.room_type_id;
    let basePrice = 1000000;

    if (this.prisma.roomType) {
      const roomType = await this.prisma.roomType.findFirst({
        where: {
          OR: [
            { id: payload.room_type_id },
            { vietSageRoomTypeId: payload.room_type_id },
          ],
        },
      });
      if (roomType) {
        targetRoomTypeId = roomType.id;
        basePrice = roomType.basePrice;
      }
    }

    let processedCount = 0;

    if (this.prisma.roomAllotment) {
      for (const adj of payload.adjustments) {
        if (!adj.date || !/^\d{4}-\d{2}-\d{2}$/.test(adj.date)) {
          continue;
        }

        const [y, m, d] = adj.date.split('-').map((v) => parseInt(v, 10));
        const dateOnly = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

        let existing: { totalRooms: number; bookedRooms: number; price: number } | null = null;
        if (typeof this.prisma.roomAllotment.findUnique === 'function') {
          existing = await this.prisma.roomAllotment
            .findUnique({
              where: {
                roomTypeId_date: {
                  roomTypeId: targetRoomTypeId,
                  date: dateOnly,
                },
              },
            })
            .catch(() => null);
        }

        const totalRooms =
          adj.total_rooms !== undefined
            ? adj.total_rooms
            : existing?.totalRooms ?? 10;

        let bookedRooms = existing?.bookedRooms ?? 0;
        if (adj.available_rooms !== undefined) {
          bookedRooms = Math.max(0, totalRooms - adj.available_rooms);
        } else if (adj.booked_rooms !== undefined) {
          bookedRooms = adj.booked_rooms;
        }

        const price =
          adj.price !== undefined
            ? adj.price
            : existing?.price ?? basePrice;

        const isBlocked =
          adj.is_blocked !== undefined
            ? adj.is_blocked
            : totalRooms <= 0 ||
              (adj.available_rooms !== undefined &&
                adj.available_rooms <= 0 &&
                bookedRooms >= totalRooms);

        if (typeof this.prisma.roomAllotment.upsert === 'function') {
          await this.prisma.roomAllotment.upsert({
            where: {
              roomTypeId_date: {
                roomTypeId: targetRoomTypeId,
                date: dateOnly,
              },
            },
            create: {
              roomTypeId: targetRoomTypeId,
              date: dateOnly,
              totalRooms,
              bookedRooms,
              price,
              isBlocked,
            },
            update: {
              ...(adj.total_rooms !== undefined ? { totalRooms: adj.total_rooms } : {}),
              bookedRooms,
              ...(adj.price !== undefined ? { price: adj.price } : {}),
              ...(adj.is_blocked !== undefined ? { isBlocked: adj.is_blocked } : {}),
            },
          });
        }

        processedCount++;
      }
    }

    if (this.prisma.vietSageSyncLog) {
      await this.prisma.vietSageSyncLog
        .create({
          data: {
            syncType: 'inbound_inventory_updated',
            direction: 'INBOUND',
            status: SyncStatus.SUCCESS,
            payload: payload as unknown as Prisma.InputJsonValue,
          },
        })
        .catch((err) => {
          this.logger.warn(`Failed to log inbound inventory webhook: ${err}`);
        });
    }

    return {
      processed: processedCount,
      roomTypeId: targetRoomTypeId,
    };
  }

  /**
   * Tải danh mục loại phòng và số lượng phòng thực tế từ VietSage PMS (HMAC Signed)
   */
  async fetchRoomCatalog(
    hotelIdentifier: string,
    partnerEmail?: string,
  ): Promise<VietSageRoomCatalogResult> {
    const path = '/channel-manager/direct-booking/catalog-export';
    const payload = {
      hotel_id: hotelIdentifier,
      ...(partnerEmail ? { partner_email: partnerEmail } : {}),
    };

    const { headers } = this.signRequest('POST', path, payload);
    const url = `${this.baseUrl}${path}`;

    const response = await this.httpClient(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Failed to fetch room catalog from VietSage PMS: ${errorText}`,
      );
      throw new BadRequestException(
        `Không thể tải danh mục phòng từ VietSage PMS: ${errorText}`,
      );
    }

    const json = (await response.json()) as any;
    const rawData = json?.data;
    const data =
      typeof rawData === 'object' && rawData !== null && 'data' in rawData
        ? rawData.data
        : (rawData ?? json);

    return {
      hotelId: data.hotel_id ?? '',
      hotelName: data.hotel_name ?? '',
      hotelCode: data.hotel_code ?? '',
      partnerEmail: data.partner_email ?? '',
      roomTypes: (data.room_types ?? []).map((rt: any) => ({
        name: rt.name,
        normalizedKey: rt.normalized_key,
        description: rt.description ?? '',
        basePrice: Number(rt.base_price ?? 0),
        totalRooms: Number(rt.total_rooms ?? 0),
        maxGuests: Number(rt.max_guests ?? 2),
        bedType: rt.bed_type ?? 'DOUBLE',
        areaSqm: Number(rt.area_sqm ?? 25),
        amenities: Array.isArray(rt.amenities) ? rt.amenities : [],
        sampleRoomNumbers: Array.isArray(rt.sample_room_numbers)
          ? rt.sample_room_numbers
          : [],
      })),
    };
  }
}
