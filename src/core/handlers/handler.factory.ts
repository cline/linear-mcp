import { LinearAuth } from '../../auth.js';
import { LinearGraphQLClient } from '../../graphql/client.js';
import { AuthHandler } from '../../features/auth/handlers/auth.handler.js';
import { IssueHandler } from '../../features/issues/handlers/issue.handler.js';
import { ProjectHandler } from '../../features/projects/handlers/project.handler.js';
import { TeamHandler } from '../../features/teams/handlers/team.handler.js';
import { UserHandler } from '../../features/users/handlers/user.handler.js';
import { CommentHandler } from '../../features/comments/handlers/comment.handler.js';

/**
 * Factory for creating and managing feature-specific handlers.
 * Ensures consistent initialization and dependency injection across handlers.
 */
export class HandlerFactory {
  private authHandler: AuthHandler;
  private issueHandler: IssueHandler;
  private projectHandler: ProjectHandler;
  private teamHandler: TeamHandler;
  private userHandler: UserHandler;
  private commentHandler: CommentHandler;

  constructor(auth: LinearAuth, graphqlClient?: LinearGraphQLClient) {
    // Initialize all handlers with shared dependencies
    this.authHandler = new AuthHandler(auth, graphqlClient);
    this.issueHandler = new IssueHandler(auth, graphqlClient);
    this.projectHandler = new ProjectHandler(auth, graphqlClient);
    this.teamHandler = new TeamHandler(auth, graphqlClient);
    this.userHandler = new UserHandler(auth, graphqlClient);
    this.commentHandler = new CommentHandler(auth, graphqlClient);
  }

  /**
   * Gets the appropriate handler for a given tool name.
   */
  getHandlerForTool(toolName: string): {
    handler: AuthHandler | IssueHandler | ProjectHandler | TeamHandler | UserHandler | CommentHandler;
    method: string;
  } {
    // Map tool names to their handlers and methods
    const handlerMap: Record<string, { handler: any; method: string }> = {
      // Auth tools
      linear_auth: { handler: this.authHandler, method: 'handleAuth' },
      linear_auth_callback: { handler: this.authHandler, method: 'handleAuthCallback' },

      // Issue tools
      linear_create_issue: { handler: this.issueHandler, method: 'handleCreateIssue' },
      linear_create_issues: { handler: this.issueHandler, method: 'handleCreateIssues' },
      linear_bulk_update_issues: { handler: this.issueHandler, method: 'handleBulkUpdateIssues' },
      linear_search_issues: { handler: this.issueHandler, method: 'handleSearchIssues' },
      linear_delete_issue: { handler: this.issueHandler, method: 'handleDeleteIssue' },
      linear_delete_issues: { handler: this.issueHandler, method: 'handleDeleteIssues' },

      // Project tools
      linear_create_project_with_issues: { handler: this.projectHandler, method: 'handleCreateProjectWithIssues' },
      linear_get_project: { handler: this.projectHandler, method: 'handleGetProject' },
      linear_search_projects: { handler: this.projectHandler, method: 'handleSearchProjects' },

      // Team tools
      linear_get_teams: { handler: this.teamHandler, method: 'handleGetTeams' },

      // User tools
      linear_get_user: { handler: this.userHandler, method: 'handleGetUser' },

      // Comment tools
      linear_get_issue_comments: { handler: this.commentHandler, method: 'handleGetIssueComments' },
      linear_create_comment: { handler: this.commentHandler, method: 'handleCreateComment' },
    };

    const handlerInfo = handlerMap[toolName];
    if (!handlerInfo) {
      throw new Error(`No handler found for tool: ${toolName}`);
    }

    return handlerInfo;
  }
}