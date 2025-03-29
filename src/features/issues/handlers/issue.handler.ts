import { BaseHandler } from '../../../core/handlers/base.handler.js';
import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';
import { LinearAuth } from '../../../auth.js';
import { LinearGraphQLClient } from '../../../graphql/client.js';
import {
  IssueHandlerMethods,
  CreateIssueInput,
  CreateIssuesInput,
  BulkUpdateIssuesInput,
  SearchIssuesInput,
  DeleteIssueInput,
  DeleteIssuesInput,
  CreateIssueResponse,
  CreateIssuesResponse,
  UpdateIssuesResponse,
  SearchIssuesResponse,
  DeleteIssueResponse,
  Issue
} from '../types/issue.types.js';

/**
 * Handler for issue-related operations.
 * Manages creating, updating, searching, and deleting issues.
 */
export class IssueHandler extends BaseHandler implements IssueHandlerMethods {
  constructor(auth: LinearAuth, graphqlClient?: LinearGraphQLClient) {
    super(auth, graphqlClient);
  }

  /**
   * Creates a single issue.
   */
  async handleCreateIssue(args: CreateIssueInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ['title', 'description', 'teamId']);

      // Process input to ensure correct types
      const processedArgs = { ...args };
      
      // Convert estimate to integer if present
      if (processedArgs.estimate !== undefined) {
        processedArgs.estimate = parseInt(String(processedArgs.estimate), 10);
        
        // If parsing fails, remove the estimate field
        if (isNaN(processedArgs.estimate)) {
          delete processedArgs.estimate;
        }
      }
      
      // Convert priority to integer if present
      if (processedArgs.priority !== undefined) {
        processedArgs.priority = parseInt(String(processedArgs.priority), 10);
        
        // If parsing fails or out of range, use default priority
        if (isNaN(processedArgs.priority) || processedArgs.priority < 0 || processedArgs.priority > 4) {
          processedArgs.priority = 0;
        }
      }

      const result = await client.createIssue(processedArgs) as CreateIssueResponse;

      if (!result.issueCreate.success || !result.issueCreate.issue) {
        throw new Error('Failed to create issue');
      }

      const issue = result.issueCreate.issue;

      return this.createResponse(
        `Successfully created issue\n` +
        `Issue: ${issue.identifier}\n` +
        `Title: ${issue.title}\n` +
        `URL: ${issue.url}\n` +
        `Project: ${issue.project ? issue.project.name : 'None'}`
      );
    } catch (error) {
      this.handleError(error, 'create issue');
    }
  }

  /**
   * Creates multiple issues in bulk.
   */
  async handleCreateIssues(args: CreateIssuesInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ['issues']);

      if (!Array.isArray(args.issues)) {
        throw new Error('Issues parameter must be an array');
      }

      const result = await client.createIssues(args.issues) as CreateIssuesResponse;

      if (!result.issueCreate.success) {
        throw new Error('Failed to create issues');
      }

      const createdIssues = result.issueCreate.issues as Issue[];

      return this.createResponse(
        `Successfully created ${createdIssues.length} issues:\n` +
        createdIssues.map(issue => 
          `- ${issue.identifier}: ${issue.title}\n  URL: ${issue.url}`
        ).join('\n')
      );
    } catch (error) {
      this.handleError(error, 'create issues');
    }
  }

  /**
   * Updates multiple issues in bulk.
   */
  async handleBulkUpdateIssues(args: BulkUpdateIssuesInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ['issueIds', 'update']);

      if (!Array.isArray(args.issueIds)) {
        throw new Error('IssueIds parameter must be an array');
      }

      let result;
      
      // Handle single issue update vs bulk update differently
      if (args.issueIds.length === 1) {
        // For a single issue, use updateIssue which uses the correct 'id' parameter
        result = await client.updateIssue(args.issueIds[0], args.update) as UpdateIssuesResponse;
        
        if (!result.issueUpdate.success) {
          throw new Error('Failed to update issue');
        }
        
        return this.createResponse(`Successfully updated issue`);
      } else {
        // For multiple issues, use updateIssues
        result = await client.updateIssues(args.issueIds, args.update) as UpdateIssuesResponse;
        
        if (!result.issueUpdate.success) {
          throw new Error('Failed to update issues');
        }
        
        const updatedCount = result.issueUpdate.issues.length;
        return this.createResponse(`Successfully updated ${updatedCount} issues`);
      }
    } catch (error) {
      this.handleError(error, 'update issues');
    }
  }

  /**
   * Searches for issues with filtering and pagination.
   */
  async handleSearchIssues(args: SearchIssuesInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();

      const filter: Record<string, unknown> = {};
      
      if (args.query) {
        // For both identifier and text searches, use the title filter with contains
        // This is a workaround since Linear API doesn't directly support identifier filtering
        filter.or = [
          { title: { containsIgnoreCase: args.query } },
          { number: { eq: this.extractIssueNumber(args.query) } }
        ];
      }
      
      if (args.filter?.project?.id?.eq) {
        filter.project = { id: { eq: args.filter.project.id.eq } };
      }
      if (args.teamIds) {
        filter.team = { id: { in: args.teamIds } };
      }
      if (args.assigneeIds) {
        filter.assignee = { id: { in: args.assigneeIds } };
      }
      if (args.states) {
        filter.state = { name: { in: args.states } };
      }
      if (typeof args.priority === 'number') {
        filter.priority = { eq: args.priority };
      }

      const result = await client.searchIssues(
        filter,
        args.first || 50,
        args.after,
        args.orderBy || 'updatedAt'
      ) as SearchIssuesResponse;

      return this.createJsonResponse(result);
    } catch (error) {
      this.handleError(error, 'search issues');
    }
  }

  /**
   * Helper method to extract the issue number from an identifier (e.g., "IDE-11" -> 11)
   */
  private extractIssueNumber(query: string): number | null {
    const match = query.match(/^[A-Z]+-(\d+)$/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return null;
  }

  /**
   * Deletes a single issue.
   */
  async handleDeleteIssue(args: DeleteIssueInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const result = await client.deleteIssue(args.id) as DeleteIssueResponse;

      if (!result.issueDelete.success) {
        throw new Error('Failed to delete issue');
      }

      return this.createResponse(`Successfully deleted issue ${args.id}`);
    } catch (error) {
      this.handleError(error, 'delete issue');
    }
  }

  /**
   * Deletes multiple issues in bulk.
   */
  async handleDeleteIssues(args: DeleteIssuesInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ['ids']);

      if (!Array.isArray(args.ids)) {
        throw new Error('Ids parameter must be an array');
      }

      const result = await client.deleteIssues(args.ids) as DeleteIssueResponse;

      if (!result.issueDelete.success) {
        throw new Error('Failed to delete issues');
      }

      return this.createResponse(
        `Successfully deleted ${args.ids.length} issues: ${args.ids.join(', ')}`
      );
    } catch (error) {
      this.handleError(error, 'delete issues');
    }
  }
}
