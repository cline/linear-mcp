import { BaseToolResponse } from "../../../core/interfaces/tool-handler.interface.js";

/**
 * Input types for issue operations
 */

export interface CreateIssueInput {
  title: string;
  description: string;
  teamId: string;
  assigneeId?: string;
  priority?: number;
  projectId?: string;
}

export interface CreateIssuesInput {
  issues: CreateIssueInput[];
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  assigneeId?: string;
  priority?: number;
  projectId?: string;
  stateId?: string;
}

export interface BulkUpdateIssuesInput {
  issueIds: string[];
  update: UpdateIssueInput;
}

export interface SearchIssuesInput {
  query?: string;
  filter?: {
    project?: {
      id?: {
        eq?: string;
      };
    };
    team?: {
      key?: {
        eq?: string;
      };
      id?: {
        in?: string[];
      };
    };
    number?: {
      eq?: number;
    };
    search?: string;
  };
  teamIds?: string[];
  assigneeIds?: string[];
  states?: string[];
  priority?: number;
  first?: number;
  after?: string;
  orderBy?: string;
}

export interface DeleteIssueInput {
  id: string;
}

export interface DeleteIssuesInput {
  ids: string[];
}

/**
 * Response types for issue operations
 */

export interface Issue {
  id: string;
  identifier: string;
  title: string;
  url: string;
  project?: {
    name: string;
  };
}

export interface CreateIssueResponse {
  issueCreate: {
    success: boolean;
    issue?: Issue;
  };
}

export interface CreateIssuesResponse {
  issueCreate: {
    success: boolean;
    issues: Issue[];
  };
}

export interface IssueBatchResponse {
  issueBatchCreate: {
    success: boolean;
    issues: Issue[];
    lastSyncId: number;
  };
}

export interface UpdateIssuesResponse {
  issueUpdate: {
    success: boolean;
    issue: Issue;
  };
}

export interface SearchIssuesResponse {
  issues: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    nodes: Issue[];
  };
}

export interface DeleteIssueResponse {
  issueDelete: {
    success: boolean;
  };
}

/**
 * Handler method types
 */

export interface IssueHandlerMethods {
  handleCreateIssue(args: CreateIssueInput): Promise<BaseToolResponse>;
  handleCreateIssues(args: CreateIssuesInput): Promise<BaseToolResponse>;
  handleBulkUpdateIssues(
    args: BulkUpdateIssuesInput
  ): Promise<BaseToolResponse>;
  handleSearchIssues(args: SearchIssuesInput): Promise<BaseToolResponse>;
  handleDeleteIssue(args: DeleteIssueInput): Promise<BaseToolResponse>;
  handleDeleteIssues(args: DeleteIssuesInput): Promise<BaseToolResponse>;
}
