import { gql } from 'graphql-tag';

export const SEARCH_ISSUES_QUERY = gql`
  query SearchIssues(
    $filter: IssueFilter
    $first: Int
    $after: String
    $orderBy: PaginationOrderBy
  ) {
    issues(
      filter: $filter
      first: $first
      after: $after
      orderBy: $orderBy
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        identifier
        title
        description
        url
        state {
          id
          name
          type
          color
        }
        assignee {
          id
          name
          email
        }
        team {
          id
          name
          key
        },
        project {
          id
          name
        },
        priority
        labels {
          nodes {
            id
            name
            color
          }
        }
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_TEAMS_QUERY = gql`
  query GetTeams {
    teams {
      nodes {
        id
        name
        key
        description
        states {
          nodes {
            id
            name
            type
            color
          }
        }
        labels {
          nodes {
            id
            name
            color
          }
        }
      }
    }
  }
`;

export const GET_USER_QUERY = gql`
  query GetUser {
    viewer {
      id
      name
      email
      teams {
        nodes {
          id
          name
          key
        }
      }
    }
  }
`;

export const SEARCH_PROJECTS_QUERY = gql`
  query SearchProjects($filter: ProjectFilter) {
    projects(filter: $filter) {
      nodes {
        id
        name
        description
        documentContent {
          content
          contentState
        }
        url
        teams {
          nodes {
            id
            name
          }
        }
      }
    }
  }
`;

export const GET_PROJECT_QUERY = gql`
  query GetProject($id: String!) {
    project(id: $id) {
      id
      name
      description
      documentContent {
        content
        contentState
      }
      url
      teams {
        nodes {
          id
          name
        }
      }
    }
  }
`;

export const GET_ISSUE_COMMENTS_QUERY = gql`
  query GetIssueComments(
    $issueId: String!
    $first: Int
    $after: String
    $includeArchived: Boolean
  ) {
    issue(id: $issueId) {
      id
      title
      comments(
        first: $first
        after: $after
        includeArchived: $includeArchived
        orderBy: createdAt
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          body
          bodyData
          user {
            id
            name
            email
          }
          parent {
            id
            body
            user {
              id
              name
            }
          }
          children(first: 10) {
            nodes {
              id
              body
              user {
                id
                name
              }
              createdAt
            }
          }
          createdAt
          updatedAt
        }
      }
    }
  }
`;

export const SEARCH_PROJECT_MILESTONES_QUERY = gql`
  query SearchProjectMilestones(
    $filter: ProjectMilestoneFilter
    $first: Int
    $after: String
    $orderBy: PaginationOrderBy
  ) {
    projectMilestones(
      filter: $filter
      first: $first
      after: $after
      orderBy: $orderBy
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        name
        description
        documentContent {
          content
          contentState
        }
        targetDate
        status
        progress
        sortOrder
        project {
          id
          name
        }
        issues(first: 10) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            identifier
            title
            url
          }
        }
        archivedAt
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_PROJECT_MILESTONE_QUERY = gql`
  query GetProjectMilestone($id: String!) {
    projectMilestone(id: $id) {
      id
      name
      description
      documentContent {
        content
        contentState
      }
      targetDate
      status
      progress
      sortOrder
      project {
        id
        name
      }
      issues(first: 50) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          identifier
          title
          url
        }
      }
      archivedAt
      createdAt
      updatedAt
    }
  }
`;
