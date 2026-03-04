import { executeQuery } from '@datocms/cda-client';

// Read-only CDA token — safe to expose to the browser
const TOKEN = process.env.NEXT_PUBLIC_DATOCMS_API_TOKEN ?? '';

export async function performRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  includeDrafts = false
): Promise<T> {
  return executeQuery<T>(query, {
    token: TOKEN,
    variables,
    ...(includeDrafts ? { includeDrafts: true } : {}),
  });
}
