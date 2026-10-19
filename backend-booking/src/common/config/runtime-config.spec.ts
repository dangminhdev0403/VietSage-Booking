import {
  getRuntimeSecret,
  getRuntimeValue,
  validateProductionEnvironment,
} from './runtime-config';

const validProductionEnvironment = {
  DATABASE_URL:
    'postgresql://booking_user:strong_database_password@postgres:5432/booking_db',
  JWT_SECRET: 'jwt_secret_at_least_32_characters_long',
  CORS_ORIGINS: 'https://booking.vietsage.com',
  VIETSAGE_API_BASE_URL: 'http://vietsage-auth-service:8080',
  VIETSAGE_HMAC_SECRET: 'hmac_secret_at_least_32_characters_long',
  STRIPE_SECRET_KEY: 'stripe_live_key_at_least_32_characters',
  STRIPE_WEBHOOK_SECRET: 'whsec_example_secret_at_least_32_chars',
  STRIPE_CHECKOUT_RETURN_BASE_URL: 'https://booking.vietsage.com',
  STRIPE_SIMULATED: 'false',
};

describe('production runtime configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ...validProductionEnvironment,
      NODE_ENV: 'production',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('rejects missing and placeholder secrets in production', () => {
    delete process.env.JWT_SECRET;
    expect(() => getRuntimeSecret('JWT_SECRET', 'development-only')).toThrow(
      'JWT_SECRET is required in production',
    );

    process.env.JWT_SECRET = 'replace_with_a_real_secret';
    expect(() => getRuntimeSecret('JWT_SECRET')).toThrow(
      'JWT_SECRET contains a placeholder value',
    );
  });

  it('allows explicit development fallbacks outside production', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.JWT_SECRET;
    expect(getRuntimeSecret('JWT_SECRET', 'development-only-secret')).toBe(
      'development-only-secret',
    );
  });

  it.each(['true', 'TRUE'])(
    'rejects simulated payments in production: %s',
    (value) => {
      process.env.STRIPE_SIMULATED = value;

      expect(() => validateProductionEnvironment()).toThrow(
        'STRIPE_SIMULATED must be disabled in production',
      );
    },
  );

  it('rejects a placeholder database URL in production', () => {
    process.env.DATABASE_URL =
      'postgresql://booking_user:replace_with_password@postgres:5432/booking_db';

    expect(() => validateProductionEnvironment()).toThrow(
      'DATABASE_URL contains a placeholder value',
    );
  });

  it('accepts a complete production environment', () => {
    expect(() => validateProductionEnvironment()).not.toThrow();
    expect(getRuntimeValue('VIETSAGE_API_BASE_URL')).toBe(
      'http://vietsage-auth-service:8080',
    );
  });
});
