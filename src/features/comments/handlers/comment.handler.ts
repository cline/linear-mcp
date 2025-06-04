import { BaseHandler } from '../../../core/handlers/base.handler.js';
import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';
import { LinearAuth } from '../../../auth.js';
import { LinearGraphQLClient } from '../../../graphql/client.js';
import {
  CommentHandlerMethods,
  CreateCommentInput,
  GetIssueCommentsInput,
  CreateCommentResponse,
  GetIssueCommentsResponse
} from '../types/comment.types.js';

/**
 * Handler for comment-related operations.
 * Manages creating and retrieving comments on issues.
 */
export class CommentHandler extends BaseHandler implements CommentHandlerMethods {
  constructor(auth: LinearAuth, graphqlClient?: LinearGraphQLClient) {
    super(auth, graphqlClient);
  }

  /**
   * Gets comments for a specific issue, including threaded replies.
   */
  async handleGetIssueComments(args: GetIssueCommentsInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ['issueId']);

      const result = await client.getIssueComments(
        args.issueId,
        args.first || 50,
        args.after,
        args.includeArchived || false
      ) as GetIssueCommentsResponse;

      // Format response for better readability
      const comments = result.issue.comments.nodes;
      const formattedResponse = {
        issueId: result.issue.id,
        issueTitle: result.issue.title,
        totalComments: comments.length,
        hasMoreComments: result.issue.comments.pageInfo.hasNextPage,
        nextCursor: result.issue.comments.pageInfo.endCursor,
        comments: comments.map(comment => ({
          id: comment.id,
          author: comment.user.name,
          authorEmail: comment.user.email,
          content: comment.body,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          isReply: !!comment.parent,
          parentComment: comment.parent ? {
            id: comment.parent.id,
            author: comment.parent.user.name,
            preview: comment.parent.body.length > 100
              ? comment.parent.body.substring(0, 100) + '...'
              : comment.parent.body
          } : null,
          hasReplies: !!comment.children?.nodes && comment.children.nodes.length > 0,
          replyCount: comment.children?.nodes ? comment.children.nodes.length : 0,
          replies: comment.children?.nodes ? comment.children.nodes.map(reply => ({
            id: reply.id,
            author: reply.user.name,
            content: reply.body.length > 150
              ? reply.body.substring(0, 150) + '...'
              : reply.body,
            createdAt: reply.createdAt
          })) : []
        }))
      };

      return this.createJsonResponse(formattedResponse);
    } catch (error) {
      this.handleError(error, 'get issue comments');
    }
  }

  /**
   * Creates a new comment on an issue or replies to an existing comment.
   */
  async handleCreateComment(args: CreateCommentInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ['body', 'issueId']);

      const result = await client.createComment(args) as CreateCommentResponse;

      if (!result.commentCreate.success) {
        throw new Error('Failed to create comment');
      }

      const comment = result.commentCreate.comment;
      const responseText = [
        `Successfully created comment`,
        `Comment ID: ${comment.id}`,
        `Author: ${comment.user.name} (${comment.user.email})`,
        `Issue: ${comment.issue.title}`,
        `Content: ${comment.body.length > 200
          ? comment.body.substring(0, 200) + '...'
          : comment.body}`,
        `Created: ${comment.createdAt}`
      ];

      if (args.parentId && comment.parent) {
        responseText.push(`Reply to: ${comment.parent.user.name}`);
        responseText.push(`Parent comment: ${comment.parent.body.length > 100
          ? comment.parent.body.substring(0, 100) + '...'
          : comment.parent.body}`);
      }

      return this.createResponse(responseText.join('\n'));
    } catch (error) {
      this.handleError(error, 'create comment');
    }
  }
}