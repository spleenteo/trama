import { IMAGE_FIELDS_FRAGMENT, NODE_SUMMARY_FIELDS_FRAGMENT } from './fragments';

/** Homepage: all root nodes (no parent) with their direct children */
export const ALL_ROOT_NODES_QUERY = /* GraphQL */ `
  query AllRootNodes {
    allNodes(filter: { parent: { exists: false } }, orderBy: position_ASC) {
      id
      title
      slug
      color { hex }
      year
      month
      day
      endYear
      toPresent
      visibility
      eventType
      featuredImage {
        responsiveImage(imgixParams: { w: 400, h: 250, fit: crop }) {
          ...imageFields
        }
      }
      children {
        id
        title
        slug
        color { hex }
        year
        month
        day
        endYear
        toPresent
        visibility
        eventType
      }
    }
  }
  ${IMAGE_FIELDS_FRAGMENT}
`;

/** Full tree from a root node — 4 levels deep for the sidebar */
export const NODE_TREE_QUERY = /* GraphQL */ `
  query NodeTree($rootId: ItemId!) {
    node(filter: { id: { eq: $rootId } }) {
      id
      title
      slug
      color { hex }
      description { value }
      featuredImage { responsiveImage { ...imageFields } }
      year
      month
      day
      endYear
      toPresent
      visibility
      eventType
      children {
        id
        title
        slug
        color { hex }
        year
        month
        day
        endYear
        toPresent
        visibility
        eventType
        children {
          id
          title
          slug
          color { hex }
          year
          month
          day
          endYear
          toPresent
          visibility
          eventType
          children {
            id
            title
            slug
            color { hex }
            year
            month
            day
            endYear
            toPresent
            visibility
            eventType
          }
        }
      }
    }
  }
  ${IMAGE_FIELDS_FRAGMENT}
`;

/** Single node by slug — for timeline page context */
export const NODE_BY_SLUG_QUERY = /* GraphQL */ `
  query NodeBySlug($slug: String!) {
    node(filter: { slug: { eq: $slug } }) {
      id
      title
      slug
      color { hex }
      description { value }
      featuredImage { responsiveImage { ...imageFields } }
      year
      month
      day
      endYear
      toPresent
      visibility
      eventType
      parent {
        id
        title
        slug
      }
      children {
        id
        title
        slug
        color { hex }
        year
        month
        day
        endYear
        toPresent
        visibility
        eventType
        children { id }
      }
    }
  }
  ${IMAGE_FIELDS_FRAGMENT}
`;

/** Child leaf nodes of a parent (events within a context) */
export const CHILD_NODES_QUERY = /* GraphQL */ `
  query ChildNodes($parentId: ItemId!, $first: IntType = 500, $skip: IntType = 0) {
    allNodes(
      filter: { parent: { eq: $parentId } }
      orderBy: year_ASC
      first: $first
      skip: $skip
    ) {
      ...nodeSummaryFields
    }
    _allNodesMeta(filter: { parent: { eq: $parentId } }) {
      count
    }
  }
  ${IMAGE_FIELDS_FRAGMENT}
  ${NODE_SUMMARY_FIELDS_FRAGMENT}
`;

/** Full node detail — for the event detail panel */
export const NODE_DETAIL_QUERY = /* GraphQL */ `
  query NodeDetail($nodeId: ItemId!) {
    node(filter: { id: { eq: $nodeId } }) {
      id
      title
      slug
      year
      month
      day
      time
      endYear
      endMonth
      endDay
      toPresent
      visibility
      eventType
      color { hex }

      description { value }
      featuredImage {
        responsiveImage(imgixParams: { w: 600 }) { ...imageFields }
      }
      location { latitude longitude }
      additionalContent {
        ... on LinkRecord {
          __typename
          id
          name
          url
        }
        ... on PhotoGalleryRecord {
          __typename
          id
          gallery {
            url
            title
            responsiveImage(imgixParams: { w: 400 }) { ...imageFields }
          }
        }
        ... on VideoRecord {
          __typename
          id
          video {
            provider
            providerUid
            url
            thumbnailUrl
            title
            width
            height
          }
        }
      }
      relatedNodes { id title slug year month parent { id title slug } }
      tags { id name slug color { hex } }
      customFields
      parent { id title slug color { hex } }
    }
  }
  ${IMAGE_FIELDS_FRAGMENT}
`;

/** Batch fetch nodes by IDs — for promoted events collected from tree traversal */
export const PROMOTED_EVENTS_QUERY = /* GraphQL */ `
  query PromotedEvents($ids: [ItemId!]!) {
    allNodes(filter: { id: { in: $ids } }, first: 500) {
      ...nodeSummaryFields
    }
  }
  ${IMAGE_FIELDS_FRAGMENT}
  ${NODE_SUMMARY_FIELDS_FRAGMENT}
`;

/** Lookup node by slug — minimal, for URL resolution */
export const NODE_BY_SLUG_MINIMAL_QUERY = /* GraphQL */ `
  query NodeBySlugMinimal($slug: String!) {
    node(filter: { slug: { eq: $slug } }) {
      id
      slug
      parent { id slug }
    }
  }
`;
