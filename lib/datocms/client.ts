import { executeQuery } from '@datocms/cda-client';

const TOKEN = process.env.DATOCMS_API_TOKEN!;

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
