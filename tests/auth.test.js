import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register(new URL('./test-hooks.mjs', import.meta.url));

function makeMockClient({ user = null, authError = null } = {}) {
  return {
    auth: {
      async getUser() {
        return { data: { user }, error: authError };
      },
      async signUp() {
        throw new Error('signUp should not be reached on validation failure');
      },
    },
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        neq() { return this; },
        in() { return this; },
        or() { return this; },
        order() { return this; },
        limit() { return this; },
        async maybeSingle() { return { data: null, error: null }; },
        async single() { return { data: null, error: null }; },
      };
    },
  };
}

function jsonRequest(url, method, body) {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

test('POST /api/auth/signup returns 400 on malformed JSON', async () => {
  globalThis.__TEST_MOCKS__ = {
    sessionClient: makeMockClient(),
    adminClient: makeMockClient(),
  };

  const { POST } = await import('@/app/api/auth/signup/route.js');
  const res = await POST(jsonRequest('http://localhost/api/auth/signup', 'POST', '{bad-json'));
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.match(data.error, /invalid json/i);
});

test('POST /api/auth/signup returns 400 when required fields are missing', async () => {
  globalThis.__TEST_MOCKS__ = {
    sessionClient: makeMockClient(),
    adminClient: makeMockClient(),
  };

  const { POST } = await import('@/app/api/auth/signup/route.js');
  const res = await POST(
    jsonRequest('http://localhost/api/auth/signup', 'POST', { email: 'a@example.com' })
  );
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.match(data.error, /password/i);
  assert.match(data.error, /role/i);
});

test('POST /api/auth/signup returns 400 on invalid role', async () => {
  globalThis.__TEST_MOCKS__ = {
    sessionClient: makeMockClient(),
    adminClient: makeMockClient(),
  };

  const { POST } = await import('@/app/api/auth/signup/route.js');
  const res = await POST(
    jsonRequest('http://localhost/api/auth/signup', 'POST', {
      email: 'a@example.com',
      password: 'Password123!',
      role: 'superadmin',
    })
  );
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.match(data.error, /invalid role/i);
});

test('Unauthenticated requests to protected customer & brand routes return 401', async () => {
  globalThis.__TEST_MOCKS__ = {
    sessionClient: makeMockClient({ user: null }),
    adminClient: makeMockClient({ user: null }),
  };

  const [profileRoute, savedRoute, requestsRoute, brandPitchesRoute] = await Promise.all([
    import('@/app/api/customer/profile/route.js'),
    import('@/app/api/customer/saved-brands/route.js'),
    import('@/app/api/customer/requests/route.js'),
    import('@/app/api/brand/pitches/route.js'),
  ]);

  const r1 = await profileRoute.GET(new Request('http://localhost/api/customer/profile'));
  assert.equal(r1.status, 401);

  const r2 = await savedRoute.GET(new Request('http://localhost/api/customer/saved-brands'));
  assert.equal(r2.status, 401);

  const r3 = await requestsRoute.POST(
    jsonRequest('http://localhost/api/customer/requests', 'POST', {
      brandId: 'brand-1',
      title: 'Custom mug',
      message: 'Please make 2',
      requestType: 'Custom Product',
    })
  );
  assert.equal(r3.status, 401);

  const r4 = await brandPitchesRoute.POST(
    jsonRequest('http://localhost/api/brand/pitches', 'POST', {
      creatorId: 'creator-1',
      compensationType: 'paid',
      message: 'Collab?',
    })
  );
  assert.equal(r4.status, 401);
});
