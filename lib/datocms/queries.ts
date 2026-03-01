import { IMAGE_FIELDS_FRAGMENT, EVENT_SUMMARY_FIELDS_FRAGMENT } from './fragments';

export const ALL_ROOT_CONTEXTS_QUERY = /* GraphQL */ `
  query AllRootContexts {
    allContexts(filter: { parent: { exists: false } }, orderBy: position_ASC) {
      id
      title
      slug
      color { hex }
      featuredImage {
        responsiveImage(imgixParams: { w: 400, h: 250, fit: crop }) {
          ...imageFields
        }
      }
      softStartYear
      softEndYear
      isConcluded
      children {
        id
        title
        slug
        color { hex }
        softStartYear
        softEndYear
        isConcluded
      }
      _allReferencingEvents(
        filter: { visibility: { eq: "super" } }
        orderBy: year_ASC
        first: 100
      ) {
        ...eventSummaryFields
      }
    }
  }
  ${IMAGE_FIELDS_FRAGMENT}
  ${EVENT_SUMMARY_FIELDS_FRAGMENT}
`;

export const CONTEXT_TREE_QUERY = /* GraphQL */ `
  query ContextTree($rootId: ItemId!) {
    context(filter: { id: { eq: $rootId } }) {
      id
      title
      slug
      color { hex }
      description { value }
      featuredImage { responsiveImage { ...imageFields } }
      softStartYear
      softEndYear
      isConcluded
      children {
        id
        title
        slug
        color { hex }
        softStartYear
        softEndYear
        isConcluded
        children {
          id
          title
          slug
          color { hex }
          softStartYear
          softEndYear
          isConcluded
          children {
            id
            title
            slug
            color { hex }
          }
        }
      }
    }
  }
  ${IMAGE_FIELDS_FRAGMENT}
`;

export const CONTEXT_BY_SLUG_QUERY = /* GraphQL */ `
  query ContextBySlug($slug: String!) {
    context(filter: { slug: { eq: $slug } }) {
      id
      title
      slug
      color { hex }
      description { value }
      featuredImage { responsiveImage { ...imageFields } }
      softStartYear
      softEndYear
      isConcluded
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
        softStartYear
        softEndYear
        isConcluded
        _allReferencingEvents(
          filter: { visibility: { in: ["super", "main"] } }
          orderBy: year_ASC
          first: 200
        ) {
          ...eventSummaryFields
        }
      }
    }
  }
  ${IMAGE_FIELDS_FRAGMENT}
  ${EVENT_SUMMARY_FIELDS_FRAGMENT}
`;

export const EVENTS_BY_CONTEXT_QUERY = /* GraphQL */ `
  query EventsByContext($contextId: ItemId!, $first: IntType = 500, $skip: IntType = 0) {
    allEvents(
      filter: { context: { eq: $contextId } }
      orderBy: year_ASC
      first: $first
      skip: $skip
    ) {
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
      visibility
      eventType
      featuredImage {
        responsiveImage(imgixParams: { w: 200, h: 200, fit: crop }) {
          ...imageFields
        }
      }
      tags { id name slug color { hex } }
      relatedEvents { id title slug year context { id title } }
    }
    _allEventsMeta(filter: { context: { eq: $contextId } }) {
      count
    }
  }
  ${IMAGE_FIELDS_FRAGMENT}
`;

export const EVENT_DETAIL_QUERY = /* GraphQL */ `
  query EventDetail($eventId: ItemId!) {
    event(filter: { id: { eq: $eventId } }) {
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
      visibility
      eventType
      description { value }
      featuredImage {
        responsiveImage(imgixParams: { w: 600 }) { ...imageFields }
      }
      media { id url title responsiveImage(imgixParams: { w: 400 }) { ...imageFields } }
      externalLinks
      relatedEvents { id title slug year month context { id title slug } }
      tags { id name slug color { hex } }
      customFields
      latitude
      longitude
      number
      context { id title slug color { hex } }
    }
  }
  ${IMAGE_FIELDS_FRAGMENT}
`;

export const EVENT_BY_SLUG_QUERY = /* GraphQL */ `
  query EventBySlug($slug: String!) {
    event(filter: { slug: { eq: $slug } }) {
      id
      slug
      context { id slug }
    }
  }
`;
