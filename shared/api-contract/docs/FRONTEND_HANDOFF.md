# Frontend Handoff Guide

## Consumption Rules for `frontend-booking`

1. **Envelope Unwrapping**:
   All endpoints return standard envelopes. Use `lib/api/schemas.ts` and `parseApiResponse` to unwrap data and validate against Zod schemas.

2. **Server-State Pattern**:
   Do not call fetch or useQuery directly in UI components. Follow:
   `API Client -> Resource -> Feature Hook -> Component`.

3. **Data Types**:
   Dates are ISO-8601 strings. Prices are in whole VND or minor currency units.
