import { BaseHandler } from '../../../core/handlers/base.handler.js';
import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';
import { LinearAuth } from '../../../auth.js';
import { LinearGraphQLClient } from '../../../graphql/client.js';
import {
  CommentHandlerMethods,
  CreateCommentInput,
  UpdateCommentInput,
  DeleteCommentInput,
  GetCommentsInput,
  CreateCommentResponse,
  UpdateCommentResponse,
  DeleteCommentResponse,
  GetCommentsResponse
} from '../types/comment.types.js';

/**
 * Handler for comment-related operations.
 * Manages creating, updating, deleting, and retrieving comments.
 */
export class CommentHandler extends BaseHandler implements CommentHandlerMethods {
  constructor(auth: LinearAuth, graphqlClient?: LinearGraphQLClient) {
    super(auth, graphqlClient);
  }

  /**
   * Creates a comment on an issue.
   */
  async handleCreateComment(args: CreateCommentInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ['body', 'issueId']);

      const result = await client.createComment(args) as CreateCommentResponse;

      if (!result.commentCreate.success || !result.commentCreate.comment) {
        throw new Error('Failed to create comment');
      }

      const comment = result.commentCreate.comment;
      const issueIdentifier = comment.issue?.identifier || 'Unknown';

      return this.createResponse(
        `Successfully created comment on issue ${issueIdentifier}\n` +
        `Comment ID: ${comment.id}\n` +
        `Created: ${new Date(comment.createdAt).toLocaleString()}\n` +
        `By: ${comment.user.name}\n` +
        `Body: ${comment.body.substring(0, 50)}${comment.body.length > 50 ? '...' : ''}`
      );
    } catch (error) {
      return this.handleError(error, 'create comment');
    }
  }

  /**
   * Updates an existing comment.
   */
  async handleUpdateComment(args: UpdateCommentInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ['id', 'body']);

      const result = await client.updateComment(args.id, { body: args.body }) as UpdateCommentResponse;

      if (!result.commentUpdate.success || !result.commentUpdate.comment) {
        throw new Error('Failed to update comment');
      }

      const comment = result.commentUpdate.comment;

      return this.createResponse(
        `Successfully updated comment\n` +
        `Comment ID: ${comment.id}\n` +
        `Updated: ${new Date(comment.updatedAt).toLocaleString()}\n` +
        `By: ${comment.user.name}\n` +
        `Body: ${comment.body.substring(0, 50)}${comment.body.length > 50 ? '...' : ''}`
      );
    } catch (error) {
      return this.handleError(error, 'update comment');
    }
  }

  /**
   * Deletes a comment.
   */
  async handleDeleteComment(args: DeleteCommentInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const result = await client.deleteComment(args.id) as DeleteCommentResponse;

      if (!result.commentDelete.success) {
        throw new Error('Failed to delete comment');
      }

      return this.createResponse(`Successfully deleted comment ${args.id}`);
    } catch (error) {
      return this.handleError(error, 'delete comment');
    }
  }

  /**
   * Gets comments for an issue with pagination support.
   */
  async handleGetComments(args: GetCommentsInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ['issueId']);

      const first = args.first || 50;
      const result = await client.getIssueComments(
        args.issueId,
        first,
        args.after
      ) as GetCommentsResponse;

      if (!result.issue || !result.issue.comments) {
        throw new Error('Failed to get comments or issue not found');
      }

      return this.createJsonResponse(result);
    } catch (error) {
      return this.handleError(error, 'get comments');
    }
  }
}
