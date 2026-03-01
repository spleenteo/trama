import { executeQuery } from '@datocms/cda-client';

// NEXT_PUBLIC_ variant is needed for client components; server components can use either
const TOKEN = process.env.NEXT_PUBLIC_DATOCMS_API_TOKEN ?? process.env.DATOCMS_API_TOKEN ?? '';

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
