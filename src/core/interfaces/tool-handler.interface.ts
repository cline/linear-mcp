/**
 * Interface for handling MCP tool requests.
 * Each handler corresponds to a specific Linear API operation.
 */
export interface ToolHandler {
  // Authentication
  handleAuth(args: any): Promise<BaseToolResponse>;
  handleAuthCallback(args: any): Promise<BaseToolResponse>;

  // Issue Operations
  handleCreateIssue(args: any): Promise<BaseToolResponse>;
  handleCreateIssues(args: any): Promise<BaseToolResponse>;
  handleBulkUpdateIssues(args: any): Promise<BaseToolResponse>;
  handleSearchIssues(args: any): Promise<BaseToolResponse>;
  handleDeleteIssue(args: any): Promise<BaseToolResponse>;
  handleDeleteIssues(args: any): Promise<BaseToolResponse>;

  // Comment Operations
  handleCreateComment(args: any): Promise<BaseToolResponse>;
  handleUpdateComment(args: any): Promise<BaseToolResponse>;
  handleDeleteComment(args: any): Promise<BaseToolResponse>;
  handleGetComments(args: any): Promise<BaseToolResponse>;

  // Project Operations
  handleCreateProjectWithIssues(args: any): Promise<BaseToolResponse>;
  handleGetProject(args: any): Promise<BaseToolResponse>;
  handleSearchProjects(args: any): Promise<BaseToolResponse>;

  // Team Operations
  handleGetTeams(args: any): Promise<BaseToolResponse>;

  // User Operations
  handleGetUser(args: any): Promise<BaseToolResponse>;
}

/**
 * Base response type for all tool handlers
 */
export interface BaseToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

/**
 * Error response for tool handlers
 */
export interface ErrorToolResponse extends BaseToolResponse {
  isError: true;
}
