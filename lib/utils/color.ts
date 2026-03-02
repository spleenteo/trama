import type { ColorField } from '@/lib/types';

export const DEFAULT_ACCENT = '#6b7280';

export const getAccentColor = (color: ColorField | null | undefined): string =>
  color?.hex ?? DEFAULT_ACCENT;
