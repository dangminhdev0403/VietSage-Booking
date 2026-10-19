const PLACEHOLDER_MARKERS = ['replace_with', '«redacted:', '<redacted>', 'changeme'];

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getRuntimeValue(name: string, developmentFallback?: string): string {
  const value = read(name);
  if (value) return value;
  if (!isProduction() && developmentFallback) return developmentFallback;
  throw new Error(`${name} is required${isProduction() ? ' in production' : ''}`);
}

export function getRuntimeSecret(name: string, developmentFallback?: string): string {
  const value = read(name);
  if (!value) {
    if (!isProduction() && developmentFallback) return developmentFallback;
    throw new Error(`${name} is required${isProduction() ? ' in production' : ''}`);
  }
  if (
    isProduction() &&
    PLACEHOLDER_MARKERS.some((marker) => value.toLowerCase().includes(marker))
  ) {
    throw new Error(`${name} contains a placeholder value`);
  }
  if (isProduction() && value.length < 32) {
    throw new Error(`${name} must be at least 32 characters in production`);
  }
  return value;
}

export function validateProductionEnvironment(): void {
  if (!isProduction()) return;

  getRuntimeSecret('DATABASE_URL');
  getRuntimeSecret('JWT_SECRET');
  getRuntimeValue('CORS_ORIGINS');
  getRuntimeValue('VIETSAGE_API_BASE_URL');
  getRuntimeSecret('VIETSAGE_HMAC_SECRET');
  getRuntimeSecret('STRIPE_SECRET_KEY');
  getRuntimeSecret('STRIPE_WEBHOOK_SECRET');
  getRuntimeValue('STRIPE_CHECKOUT_RETURN_BASE_URL');

  if (process.env.STRIPE_SIMULATED?.toLowerCase() === 'true') {
    throw new Error('STRIPE_SIMULATED must be disabled in production');
  }
}
