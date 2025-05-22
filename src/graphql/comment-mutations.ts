import { gql } from 'graphql-tag';

export const CREATE_COMMENT_MUTATION = gql`
  mutation CreateComment($input: CommentCreateInput!) {
    commentCreate(input: $input) {
      success
      comment {
        id
        body
        user {
          id
          name
          email
        }
        createdAt
        updatedAt
        issue {
          id
          identifier
          title
        }
      }
    }
  }
`;

export const UPDATE_COMMENT_MUTATION = gql`
  mutation UpdateComment($id: String!, $input: CommentUpdateInput!) {
    commentUpdate(id: $id, input: $input) {
      success
      comment {
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
`;

export const DELETE_COMMENT_MUTATION = gql`
  mutation DeleteComment($id: String!) {
    commentDelete(id: $id) {
      success
    }
  }
`;
