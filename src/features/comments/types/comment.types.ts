import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';

/**
 * Input types for comment operations
 */

export interface CreateCommentInput {
  body: string;
  issueId: string;
}

export interface CommentUpdateInput {
  body: string;
}

export interface UpdateCommentInput {
  id: string;
  body: string;
}

export interface DeleteCommentInput {
  id: string;
}

export interface GetCommentsInput {
  issueId: string;
  first?: number;
  after?: string;
}

/**
 * Response types for comment operations
 */

export interface Comment {
  id: string;
  body: string;
  user: {
    id: string;
    name: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
  issue?: {
    id: string;
    identifier: string;
    title: string;
  };
}

export interface CreateCommentResponse {
  commentCreate: {
    success: boolean;
    comment?: Comment;
  };
}

export interface UpdateCommentResponse {
  commentUpdate: {
    success: boolean;
    comment?: Comment;
  };
}

export interface DeleteCommentResponse {
  commentDelete: {
    success: boolean;
  };
}

export interface GetCommentsResponse {
  issue: {
    comments: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
      nodes: Comment[];
    };
  };
}

/**
 * Handler method types
 */

export interface CommentHandlerMethods {
  handleCreateComment(args: CreateCommentInput): Promise<BaseToolResponse>;
  handleUpdateComment(args: UpdateCommentInput): Promise<BaseToolResponse>;
  handleDeleteComment(args: DeleteCommentInput): Promise<BaseToolResponse>;
  handleGetComments(args: GetCommentsInput): Promise<BaseToolResponse>;
}
