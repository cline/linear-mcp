import { gql } from 'graphql-tag';

export const CREATE_ISSUE_MUTATION = gql`
  mutation CreateIssues($input: IssueCreateInput!) {
    issueCreate(input: $input) {
      success
      issue {
        id
        identifier
        title
        url
        team {
          id
          name
        }
        project {
          id
          name
        }
      }
    }
  }
`;

export const CREATE_PROJECT = gql`
  mutation CreateProject($input: ProjectCreateInput!) {
    projectCreate(input: $input) {
      success
      project {
        id
        name
        url
      }
      lastSyncId
    }
  }
`;

export const CREATE_BATCH_ISSUES = gql`
  mutation CreateBatchIssues($input: IssueBatchCreateInput!) {
    issueBatchCreate(input: $input) {
      success
      issues {
        id
        identifier
        title
        url
      }
      lastSyncId
    }
  }
`;

export const UPDATE_ISSUES_MUTATION = gql`
  # Note: Changed from ids: [String!]! based on API error message
  mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) { 
    # Assuming the mutation field itself might also be singular if it takes a single ID
    issueUpdate(id: $id, input: $input) { 
      success
      # The response might only contain one issue now, adjust if needed based on testing
      issue { 
        id
        identifier
        title
        url
        state {
          name
        }
      }
    }
  }
`;

export const DELETE_ISSUES_MUTATION = gql`
  mutation DeleteIssues($ids: [String!]!) {
    issueDelete(ids: $ids) {
      success
    }
  }
`;

export const CREATE_ISSUE_LABELS = gql`
  mutation CreateIssueLabels($labels: [IssueLabelCreateInput!]!) {
    issueLabelCreate(input: $labels) {
      success
      issueLabels {
        id
        name
        color
      }
    }
  }
`;
