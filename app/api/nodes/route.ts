import { NextResponse } from 'next/server';
import { buildClient } from '@datocms/cma-client-node';

const NODE_MODEL = 'JbziKHLoTUCdJCdTZwWWlg';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export async function POST(request: Request) {
  const token = process.env.DATOCMS_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Missing CMA token' }, { status: 500 });
  }

  const body = await request.json();
  const { title, year, endYear, month, day, endMonth, endDay, visibility, parent } = body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }
  if (year == null || isNaN(Number(year))) {
    return NextResponse.json({ error: 'Year is required' }, { status: 400 });
  }

  const client = buildClient({ apiToken: token });

  try {
    const item = await client.items.create({
      item_type: { type: 'item_type', id: NODE_MODEL },
      title: title.trim(),
      slug: slugify(title.trim()),
      year: Number(year),
      end_year: endYear != null && endYear !== '' ? Number(endYear) : null,
      month: month != null ? Number(month) : null,
      day: day != null ? Number(day) : null,
      end_month: endMonth != null ? Number(endMonth) : null,
      end_day: endDay != null ? Number(endDay) : null,
      visibility: visibility || 'regular',
      event_type: 'event',
      ...(parent ? { parent_id: parent } : {}),
    });

    await client.items.publish(item.id);

    return NextResponse.json({ id: item.id, slug: (item as Record<string, unknown>).slug });
  } catch (err) {
    console.error('DatoCMS create error:', err);
    return NextResponse.json(
      { error: 'Failed to create node' },
      { status: 500 },
    );
  }
}
