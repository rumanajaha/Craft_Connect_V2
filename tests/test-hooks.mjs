import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();

const VIRTUAL_PREFIX = 'virtual-test-mock:';

const VIRTUAL_MODULES = {
  'next/server': `
    export class NextResponse extends Response {
      static json(body, init = {}) {
        const headers = new Headers(init.headers || {});
        headers.set('content-type', 'application/json');
        return new Response(JSON.stringify(body), { ...init, headers });
      }
    }
  `,
  '@/lib/supabaseRouteHandler': `
    export function getSupabaseRouteClient() {
      return globalThis.__TEST_MOCKS__.sessionClient;
    }
  `,
  '@/lib/supabaseServer': `
    export const supabaseAdmin = new Proxy({}, {
      get(_target, prop) {
        return globalThis.__TEST_MOCKS__.adminClient[prop];
      }
    });
  `,
  '@supabase/supabase-js': `
    export function createClient() {
      return new Proxy({}, {
        get(_target, prop) {
          return globalThis.__TEST_MOCKS__.adminClient[prop];
        }
      });
    }
  `,
};

export async function resolve(specifier, context, nextResolve) {
  if (specifier in VIRTUAL_MODULES) {
    return { url: VIRTUAL_PREFIX + specifier, shortCircuit: true };
  }

  if (specifier.endsWith('/supabaseRouteHandler') || specifier.endsWith('/supabaseRouteHandler.js')) {
    return { url: VIRTUAL_PREFIX + '@/lib/supabaseRouteHandler', shortCircuit: true };
  }
  if (specifier.endsWith('/supabaseServer') || specifier.endsWith('/supabaseServer.js')) {
    return { url: VIRTUAL_PREFIX + '@/lib/supabaseServer', shortCircuit: true };
  }

  if (specifier.startsWith('@/')) {
    const rel = specifier.slice(2);
    const candidates = [
      path.join(ROOT, rel),
      path.join(ROOT, rel + '.js'),
      path.join(ROOT, rel + '.mjs'),
      path.join(ROOT, rel, 'index.js'),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
  }

  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file://')) {
    const parentDir = path.dirname(new URL(context.parentURL).pathname);
    const resolved = path.resolve(parentDir, specifier);
    for (const candidate of [resolved, resolved + '.js', resolved + '.mjs']) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith(VIRTUAL_PREFIX)) {
    const key = url.slice(VIRTUAL_PREFIX.length);
    return {
      format: 'module',
      shortCircuit: true,
      source: VIRTUAL_MODULES[key],
    };
  }
  return nextLoad(url, context);
}
