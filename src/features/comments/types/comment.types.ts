import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';

/**
 * Comment data structures
 */

export interface Comment {
  id: string;
  body: string;                    // Markdown content
  bodyData?: string;               // ProseMirror JSON (optional)
  user: {
    id: string;
    name: string;
    email: string;
  };
  issue: {
    id: string;
    title: string;
  };
  parent?: Comment;                // For threading
  children?: CommentConnection;    // For threading
  createdAt: string;
  updatedAt: string;
}

export interface CommentConnection {
  nodes: Comment[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

/**
 * Input types for comment operations
 */

export interface CreateCommentInput {
  body: string;                    // Markdown content
  issueId: string;
  parentId?: string;        // For threading
  createAsUser?: string;           // For OAuth apps
  displayIconUrl?: string;         // For OAuth apps
}

export interface GetIssueCommentsInput {
  issueId: string;
  first?: number;                  // Pagination
  after?: string;                  // Pagination cursor
  includeArchived?: boolean;
}

/**
 * Response types for comment operations
 */

export interface CreateCommentResponse {
  commentCreate: {
    success: boolean;
    comment: Comment;
    lastSyncId: number;
  };
}

export interface GetIssueCommentsResponse {
  issue: {
    id: string;
    title: string;
    comments: CommentConnection;
  };
}

/**
 * Handler method types
 */

export interface CommentHandlerMethods {
  handleGetIssueComments(args: GetIssueCommentsInput): Promise<BaseToolResponse>;
  handleCreateComment(args: CreateCommentInput): Promise<BaseToolResponse>;
}