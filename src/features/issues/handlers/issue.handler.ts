import { BaseHandler } from "../../../core/handlers/base.handler.js";
import { BaseToolResponse } from "../../../core/interfaces/tool-handler.interface.js";
import { LinearAuth } from "../../../auth.js";
import { LinearGraphQLClient } from "../../../graphql/client.js";
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
  Issue,
} from "../types/issue.types.js";
import { TeamState } from "../../teams/types/team.types.js";

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
      this.validateRequiredParams(args, ["title", "description", "teamId"]);

      const result = (await client.createIssue(args)) as CreateIssueResponse;

      if (!result.issueCreate.success || !result.issueCreate.issue) {
        throw new Error("Failed to create issue");
      }

      const issue = result.issueCreate.issue;

      return this.createResponse(
        `Successfully created issue\n` +
          `Issue: ${issue.identifier}\n` +
          `Title: ${issue.title}\n` +
          `URL: ${issue.url}\n` +
          `Project: ${issue.project ? issue.project.name : "None"}`
      );
    } catch (error) {
      this.handleError(error, "create issue");
    }
  }

  /**
   * Creates multiple issues in bulk.
   */
  async handleCreateIssues(args: CreateIssuesInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ["issues"]);

      if (!Array.isArray(args.issues)) {
        throw new Error("Issues parameter must be an array");
      }

      const result = (await client.createIssues(
        args.issues
      )) as CreateIssuesResponse;

      if (!result.issueCreate.success) {
        throw new Error("Failed to create issues");
      }

      const createdIssues = result.issueCreate.issues as Issue[];

      return this.createResponse(
        `Successfully created ${createdIssues.length} issues:\n` +
          createdIssues
            .map(
              (issue) =>
                `- ${issue.identifier}: ${issue.title}\n  URL: ${issue.url}`
            )
            .join("\n")
      );
    } catch (error) {
      this.handleError(error, "create issues");
    }
  }

  /**
   * Updates multiple issues in bulk.
   */
  async handleBulkUpdateIssues(
    args: BulkUpdateIssuesInput
  ): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ["issueIds", "update"]);

      if (!Array.isArray(args.issueIds)) {
        throw new Error("IssueIds parameter must be an array");
      }

      // Handle state name instead of state ID
      if (
        args.update.stateId &&
        typeof args.update.stateId === "string" &&
        !args.update.stateId.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        )
      ) {
        // This looks like a state name, not a UUID
        const stateName = args.update.stateId.toLowerCase();

        // Get all teams to find the state
        const teamsResponse = await client.getTeams();
        const teams = teamsResponse.teams.nodes;

        let stateId: string | undefined;

        // Search through all teams and their states to find a matching state name
        for (const team of teams) {
          const matchingState = team.states.find(
            (state: TeamState) => state.name.toLowerCase() === stateName
          );

          if (matchingState) {
            stateId = matchingState.id;
            break;
          }
        }

        if (!stateId) {
          throw new Error(
            `Could not find state with name: ${args.update.stateId}`
          );
        }

        // Replace the state name with the state ID
        args.update.stateId = stateId;
      }

      const result = (await client.updateIssues(
        args.issueIds,
        args.update
      )) as UpdateIssuesResponse;

      if (!result.issueUpdate.success) {
        throw new Error("Failed to update issues");
      }

      return this.createResponse(
        `Successfully updated ${args.issueIds.length} issues`
      );
    } catch (error) {
      this.handleError(error, "update issues");
    }
  }

  /**
   * Searches for issues with filtering and pagination.
   */
  async handleSearchIssues(args: SearchIssuesInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      const filter: Record<string, unknown> = {};

      // Check if the query looks like an issue identifier (e.g., EXE-5143)
      if (args.query && /^[A-Z]+-\d+$/.test(args.query.trim())) {
        // If it's an issue identifier, parse the team key and issue number
        const [teamKey, issueNumber] = args.query.trim().split("-");

        // Use team.key and number filters instead of identifier
        filter.team = { key: { eq: teamKey } };
        filter.number = { eq: parseInt(issueNumber, 10) };
      } else if (args.query) {
        // Otherwise use it as a search term
        filter.search = args.query;
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
      if (typeof args.priority === "number") {
        filter.priority = { eq: args.priority };
      }

      const result = (await client.searchIssues(
        filter as SearchIssuesInput["filter"],
        args.first || 50,
        args.after,
        args.orderBy || "updatedAt"
      )) as SearchIssuesResponse;

      return this.createJsonResponse(result);
    } catch (error) {
      this.handleError(error, "search issues");
    }
  }

  /**
   * Deletes a single issue.
   */
  async handleDeleteIssue(args: DeleteIssueInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ["id"]);

      const result = (await client.deleteIssue(args.id)) as DeleteIssueResponse;

      if (!result.issueDelete.success) {
        throw new Error("Failed to delete issue");
      }

      return this.createResponse(`Successfully deleted issue ${args.id}`);
    } catch (error) {
      this.handleError(error, "delete issue");
    }
  }

  /**
   * Deletes multiple issues in bulk.
   */
  async handleDeleteIssues(args: DeleteIssuesInput): Promise<BaseToolResponse> {
    try {
      const client = this.verifyAuth();
      this.validateRequiredParams(args, ["ids"]);

      if (!Array.isArray(args.ids)) {
        throw new Error("Ids parameter must be an array");
      }

      const result = (await client.deleteIssues(
        args.ids
      )) as DeleteIssueResponse;

      if (!result.issueDelete.success) {
        throw new Error("Failed to delete issues");
      }

      return this.createResponse(
        `Successfully deleted ${args.ids.length} issues: ${args.ids.join(", ")}`
      );
    } catch (error) {
      this.handleError(error, "delete issues");
    }
  }
}
