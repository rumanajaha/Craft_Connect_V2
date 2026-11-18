import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register(new URL('./test-hooks.mjs', import.meta.url));

const THREAD_AB = {
  id: 'thread-ab',
  participant_a_id: 'user-a',
  participant_b_id: 'user-b',
  status: 'accepted',
  initiated_by: 'user-a',
};

const THREAD_MESSAGES = [
  {
    id: 'msg-1',
    thread_id: 'thread-ab',
    sender_id: 'user-a',
    body: 'Hello from A',
    attachment_url: null,
    created_at: '2026-11-01T10:00:00Z',
  },
];

function makeAdminMock() {
  return {
    from(table) {
      let filterId = null;
      const chain = {
        select() { return chain; },
        eq(col, val) {
          if (col === 'id' || col === 'thread_id') filterId = val;
          return chain;
        },
        gt() { return chain; },
        order() {
          if (table === 'Message') {
            return Promise.resolve({
              data: filterId === THREAD_AB.id ? THREAD_MESSAGES : [],
              error: null,
            });
          }
          return Promise.resolve({ data: [], error: null });
        },
        async maybeSingle() {
          if (table === 'MessageThread') {
            return {
              data: filterId === THREAD_AB.id ? THREAD_AB : null,
              error: null,
            };
          }
          if (table === 'ThreadClearState') {
            return { data: null, error: null };
          }
          return { data: null, error: null };
        },
      };
      return chain;
    },
  };
}

function makeSessionMock(user) {
  return {
    auth: {
      async getUser() {
        return { data: { user }, error: null };
      },
    },
  };
}

test('Unauthenticated GET and POST /api/messages/[id] return 401', async () => {
  globalThis.__TEST_MOCKS__ = {
    sessionClient: makeSessionMock(null),
    adminClient: makeAdminMock(),
  };

  const { GET, POST } = await import('@/app/api/messages/[id]/route.js');

  const getRes = await GET(new Request('http://localhost/api/messages/thread-ab'), {
    params: Promise.resolve({ id: 'thread-ab' }),
  });
  assert.equal(getRes.status, 401);

  const postRes = await POST(
    new Request('http://localhost/api/messages/thread-ab', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Unauthorized message' }),
    }),
    { params: Promise.resolve({ id: 'thread-ab' }) }
  );
  assert.equal(postRes.status, 401);
});

test('A user cannot read another user’s thread (returns 403 Forbidden)', async () => {
  globalThis.__TEST_MOCKS__ = {
    sessionClient: makeSessionMock({ id: 'user-c', email: 'c@example.com' }),
    adminClient: makeAdminMock(),
  };

  const { GET, POST } = await import('@/app/api/messages/[id]/route.js');

  const getRes = await GET(new Request('http://localhost/api/messages/thread-ab'), {
    params: Promise.resolve({ id: 'thread-ab' }),
  });
  const getData = await getRes.json();
  assert.equal(getRes.status, 403);
  assert.match(getData.error, /forbidden/i);

  const postRes = await POST(
    new Request('http://localhost/api/messages/thread-ab', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Trying to snoop' }),
    }),
    { params: Promise.resolve({ id: 'thread-ab' }) }
  );
  assert.equal(postRes.status, 403);
});

test('A thread participant can read their own thread (returns 200)', async () => {
  globalThis.__TEST_MOCKS__ = {
    sessionClient: makeSessionMock({ id: 'user-a', email: 'a@example.com' }),
    adminClient: makeAdminMock(),
  };

  const { GET } = await import('@/app/api/messages/[id]/route.js');

  const res = await GET(new Request('http://localhost/api/messages/thread-ab'), {
    params: Promise.resolve({ id: 'thread-ab' }),
  });
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.messages.length, 1);
  assert.equal(data.messages[0].text, 'Hello from A');
  assert.equal(data.messages[0].sender, 'me');
});
