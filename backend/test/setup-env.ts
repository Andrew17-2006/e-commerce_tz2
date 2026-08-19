process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';
process.env.DATABASE_URL ??=
  'postgresql://postgres:postgres@localhost:5432/marketplace_test?schema=public';
process.env.REDIS_URL ??= 'redis://localhost:6379';
