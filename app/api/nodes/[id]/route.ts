import { NextResponse } from 'next/server';
import { buildClient } from '@datocms/cma-client-node';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = process.env.DATOCMS_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Missing CMA token' }, { status: 500 });
  }

  const { id } = await params;
  const body = await request.json();
  const { parent_id } = body;

  if (!parent_id) {
    return NextResponse.json({ error: 'parent_id is required' }, { status: 400 });
  }

  const client = buildClient({ apiToken: token });

  try {
    await client.items.update(id, { parent_id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DatoCMS update error:', err);
    return NextResponse.json(
      { error: 'Failed to update node' },
      { status: 500 },
    );
  }
}
