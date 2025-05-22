import { CommentHandler } from '../features/comments/handlers/comment.handler';
import { LinearAuth } from '../auth';
import { LinearGraphQLClient } from '../graphql/client';
import { CreateCommentResponse, UpdateCommentResponse, DeleteCommentResponse, GetCommentsResponse } from '../features/comments/types/comment.types';

// Mock LinearAuth and LinearGraphQLClient
jest.mock('../auth');
jest.mock('../graphql/client');

describe('CommentHandler', () => {
  let commentHandler: CommentHandler;
  let mockAuth: jest.Mocked<LinearAuth>;
  let mockClient: jest.Mocked<LinearGraphQLClient>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockAuth = new LinearAuth() as jest.Mocked<LinearAuth>;
    mockClient = new LinearGraphQLClient(null as any) as jest.Mocked<LinearGraphQLClient>;

    // Setup auth mock to return the client
    mockAuth.getClient.mockReturnValue({} as any);
    mockAuth.isAuthenticated.mockReturnValue(true);

    // Create handler with mocks
    commentHandler = new CommentHandler(mockAuth, mockClient);
  });

  describe('handleCreateComment', () => {
    it('should create a comment successfully', async () => {
      // Mock successful comment creation
      const mockResponse: CreateCommentResponse = {
        commentCreate: {
          success: true,
          comment: {
            id: 'comment-123',
            body: 'Test comment',
            user: {
              id: 'user-123',
              name: 'Test User'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            issue: {
              id: 'issue-123',
              identifier: 'TEST-123',
              title: 'Test Issue'
            }
          }
        }
      };

      mockClient.createComment.mockResolvedValue(mockResponse);

      // Call the handler
      const result = await commentHandler.handleCreateComment({
        body: 'Test comment',
        issueId: 'issue-123'
      });

      // Verify the result
      expect(result).toBeDefined();
      expect(result.content[0].type).toBe('text/plain');
      expect(result.content[0].text).toContain('Successfully created comment');
      expect(result.content[0].text).toContain('TEST-123');
      
      // Verify the client was called correctly
      expect(mockClient.createComment).toHaveBeenCalledWith({
        body: 'Test comment',
        issueId: 'issue-123'
      });
    });

    it('should handle failure when creating a comment', async () => {
      // Mock failed comment creation
      const mockResponse: CreateCommentResponse = {
        commentCreate: {
          success: false
        }
      };

      mockClient.createComment.mockResolvedValue(mockResponse);

      // Call the handler and expect it to throw
      await expect(
        commentHandler.handleCreateComment({
          body: 'Test comment',
          issueId: 'issue-123'
        })
      ).rejects.toThrow('Failed to create comment');
    });
  });

  describe('handleUpdateComment', () => {
    it('should update a comment successfully', async () => {
      // Mock successful comment update
      const mockResponse: UpdateCommentResponse = {
        commentUpdate: {
          success: true,
          comment: {
            id: 'comment-123',
            body: 'Updated comment',
            user: {
              id: 'user-123',
              name: 'Test User'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      };

      mockClient.updateComment.mockResolvedValue(mockResponse);

      // Call the handler
      const result = await commentHandler.handleUpdateComment({
        id: 'comment-123',
        body: 'Updated comment'
      });

      // Verify the result
      expect(result).toBeDefined();
      expect(result.content[0].type).toBe('text/plain');
      expect(result.content[0].text).toContain('Successfully updated comment');
      
      // Verify the client was called correctly
      expect(mockClient.updateComment).toHaveBeenCalledWith('comment-123', { body: 'Updated comment' });
    });
  });

  describe('handleDeleteComment', () => {
    it('should delete a comment successfully', async () => {
      // Mock successful comment deletion
      const mockResponse: DeleteCommentResponse = {
        commentDelete: {
          success: true
        }
      };

      mockClient.deleteComment.mockResolvedValue(mockResponse);

      // Call the handler
      const result = await commentHandler.handleDeleteComment({
        id: 'comment-123'
      });

      // Verify the result
      expect(result).toBeDefined();
      expect(result.content[0].type).toBe('text/plain');
      expect(result.content[0].text).toContain('Successfully deleted comment');
      
      // Verify the client was called correctly
      expect(mockClient.deleteComment).toHaveBeenCalledWith('comment-123');
    });
  });

  describe('handleGetComments', () => {
    it('should get comments successfully', async () => {
      // Mock successful comments retrieval
      const mockResponse: GetCommentsResponse = {
        issue: {
          comments: {
            pageInfo: {
              hasNextPage: false,
              endCursor: null
            },
            nodes: [
              {
                id: 'comment-123',
                body: 'Test comment',
                user: {
                  id: 'user-123',
                  name: 'Test User'
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            ]
          }
        }
      };

      mockClient.getIssueComments.mockResolvedValue(mockResponse);

      // Call the handler
      const result = await commentHandler.handleGetComments({
        issueId: 'issue-123',
        first: 10
      });

      // Verify the result
      expect(result).toBeDefined();
      expect(result.content[0].type).toBe('application/json');
      
      // Verify the client was called correctly
      expect(mockClient.getIssueComments).toHaveBeenCalledWith('issue-123', 10, undefined);
    });

    it('should handle failure when issue not found', async () => {
      // Mock failed comments retrieval (issue not found)
      const mockResponse = {};
      mockClient.getIssueComments.mockResolvedValue(mockResponse as any);

      // Call the handler and expect it to throw
      await expect(
        commentHandler.handleGetComments({
          issueId: 'invalid-issue'
        })
      ).rejects.toThrow('Failed to get comments or issue not found');
    });
  });
});
