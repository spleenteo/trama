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

export const NODE_SUMMARY_FIELDS_FRAGMENT = /* GraphQL */ `
  fragment nodeSummaryFields on NodeRecord {
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
    color { hex }
    concluded
    featuredImage {
      responsiveImage(imgixParams: { w: 200, h: 200, fit: crop }) {
        ...imageFields
      }
    }
    tags { id name slug color { hex } }
    relatedNodes { id title slug year }
  }
`;
