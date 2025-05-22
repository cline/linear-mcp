import { gql } from 'graphql-tag';

export const GET_ISSUE_COMMENTS_QUERY = gql`
  query GetIssueComments($issueId: String!, $first: Int, $after: String) {
    issue(id: $issueId) {
      comments(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          body
          user {
            id
            name
            email
          }
          createdAt
          updatedAt
        }
      }
    }
  }
`;
