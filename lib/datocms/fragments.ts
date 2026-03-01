export const IMAGE_FIELDS_FRAGMENT = /* GraphQL */ `
  fragment imageFields on ResponsiveImage {
    src
    srcSet
    width
    height
    alt
    title
    base64
  }
`;

export const EVENT_SUMMARY_FIELDS_FRAGMENT = /* GraphQL */ `
  fragment eventSummaryFields on EventRecord {
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
`;
