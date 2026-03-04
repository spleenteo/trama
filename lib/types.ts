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

export interface LatLonField {
  latitude: number;
  longitude: number;
}

export interface VideoField {
  provider: string;
  providerUid: string;
  url: string;
  thumbnailUrl: string;
  title: string | null;
  width: number;
  height: number;
}

// ─── Tag ─────────────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: ColorField | null;
}

// ─── Additional content blocks ───────────────────────────────────────────────

export type AdditionalContentBlock =
  | { __typename: 'LinkRecord'; id: string; name: string; url: string }
  | { __typename: 'PhotoGalleryRecord'; id: string; gallery: FileField[] }
  | { __typename: 'VideoRecord'; id: string; video: VideoField };

// ─── Node (unified model) ────────────────────────────────────────────────────

export type Visibility = 'regular' | 'main' | 'super';
export type EventType = 'event' | 'incident' | 'key_moment';

export interface CustomField {
  key: string;
  value: string;
}

/** Minimal node data — used in tree items, sidebar, bars */
export interface NodeBase {
  id: string;
  title: string;
  slug: string;
  color: ColorField | null;
  year: number;
  endYear: number | null;
  toPresent: boolean;
  visibility: Visibility;
  eventType: EventType;
}

/** Node with tree structure — sidebar, context tree */
export interface NodeTree extends NodeBase {
  description: object | null; // DAST value
  featuredImage: FileField | null;
  children: NodeTree[];
}

/** Node summary — used in event markers and canvas rendering */
export interface NodeSummary extends NodeBase {
  month: number | null;
  day: number | null;
  time: string | null;
  endMonth: number | null;
  endDay: number | null;
  featuredImage: { responsiveImage: ResponsiveImage | null } | null;
  tags: Tag[];
  relatedNodes: Array<{
    id: string;
    title: string;
    slug: string;
    year: number;
  }>;
}

/** Node for homepage cards — lighter than full tree */
export interface NodeCard extends NodeBase {
  featuredImage: { responsiveImage: ResponsiveImage | null } | null;
  children: NodeBase[];
}

/** Full node detail — for the detail panel */
export interface NodeDetail extends NodeSummary {
  description: object | null; // DAST value
  location: LatLonField | null;
  additionalContent: AdditionalContentBlock[];
  customFields: CustomField[] | null;
  parent: { id: string; title: string; slug: string; color: ColorField | null } | null;
  relatedNodes: Array<{
    id: string;
    title: string;
    slug: string;
    year: number;
    month: number | null;
    parent: { id: string; title: string; slug: string } | null;
  }>;
}

/** Child event with inherited source info (for sub-timeline rendering) */
export interface ChildEvent extends NodeSummary {
  sourceContextId: string;
  sourceContextColor: string | null;
}

/** Computed range — attached after tree traversal */
export interface NodeWithRange extends NodeBase {
  computedStart: number;
  computedEnd: number;
}
