// ─── Shared ──────────────────────────────────────────────────────────────────

export interface ResponsiveImage {
  src: string;
  srcSet: string;
  width: number;
  height: number;
  alt: string | null;
  title: string | null;
  base64: string | null;
}

export interface FileField {
  url: string;
  title: string | null;
  responsiveImage: ResponsiveImage | null;
}

export interface ColorField {
  hex: string;
}

// ─── Tag ─────────────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: ColorField | null;
}

// ─── Context ─────────────────────────────────────────────────────────────────

export interface ContextBase {
  id: string;
  title: string;
  slug: string;
  color: ColorField | null;
  softStartYear: number | null;
  softEndYear: number | null;
  isConcluded: boolean | null;
}

export interface ContextTree extends ContextBase {
  description: object | null; // DAST value
  featuredImage: FileField | null;
  children: ContextTree[];
}

export interface ContextCard extends ContextBase {
  featuredImage: { responsiveImage: ResponsiveImage | null } | null;
  children: ContextBase[];
}

// ─── Event ───────────────────────────────────────────────────────────────────

export type Visibility = 'regular' | 'main' | 'super';
export type EventType = 'event' | 'incident' | 'key_moment';

export interface ExternalLink {
  url: string;
  label: string;
}

export interface CustomField {
  key: string;
  value: string;
}

export interface EventSummary {
  id: string;
  title: string;
  slug: string;
  year: number;
  month: number | null;
  day: number | null;
  time: string | null;
  endYear: number | null;
  endMonth: number | null;
  endDay: number | null;
  visibility: Visibility;
  eventType: EventType;
  featuredImage: { responsiveImage: ResponsiveImage | null } | null;
  tags: Tag[];
  relatedEvents: Array<{
    id: string;
    title: string;
    slug: string;
    year: number;
    context: { id: string; title: string };
  }>;
}

export interface ChildEvent extends EventSummary {
  sourceContextId: string;
  sourceContextColor: string | null;
}

export interface EventDetail extends EventSummary {
  description: object | null; // DAST value
  media: FileField[];
  externalLinks: ExternalLink[] | null;
  customFields: CustomField[] | null;
  latitude: number | null;
  longitude: number | null;
  number: number | null;
  context: ContextBase;
  relatedEvents: Array<{
    id: string;
    title: string;
    slug: string;
    year: number;
    month: number | null;
    context: { id: string; title: string; slug: string };
  }>;
}
