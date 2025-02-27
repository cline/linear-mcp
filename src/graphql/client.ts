import { LinearClient } from "@linear/sdk";
import { DocumentNode } from "graphql";
import {
  CreateIssueInput,
  CreateIssueResponse,
  CreateIssuesResponse,
  UpdateIssueInput,
  UpdateIssuesResponse,
  SearchIssuesInput,
  SearchIssuesResponse,
  DeleteIssueResponse,
  Issue,
  IssueBatchResponse,
} from "../features/issues/types/issue.types.js";
import {
  ProjectInput,
  ProjectResponse,
  SearchProjectsResponse,
} from "../features/projects/types/project.types.js";
import {
  TeamResponse,
  LabelInput,
  LabelResponse,
} from "../features/teams/types/team.types.js";
import { UserResponse } from "../features/users/types/user.types.js";

export class LinearGraphQLClient {
  private linearClient: LinearClient;

  constructor(linearClient: LinearClient) {
    this.linearClient = linearClient;
  }

  async execute<T, V extends Record<string, unknown> = Record<string, unknown>>(
    document: DocumentNode,
    variables?: V
  ): Promise<T> {
    const graphQLClient = this.linearClient.client;
    try {
      const response = await graphQLClient.rawRequest(
        document.loc?.source.body || "",
        variables
      );
      return response.data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GraphQL operation failed: ${error.message}`);
      }
      throw error;
    }
  }

  // Create single issue
  async createIssue(input: CreateIssueInput): Promise<CreateIssueResponse> {
    const { CREATE_ISSUES_MUTATION } = await import("./mutations.js");
    return this.execute<CreateIssueResponse>(CREATE_ISSUES_MUTATION, {
      input: [input],
    });
  }

  // Create multiple issues
  async createIssues(
    issues: CreateIssueInput[]
  ): Promise<CreateIssuesResponse> {
    const { CREATE_ISSUES_MUTATION } = await import("./mutations.js");
    return this.execute<CreateIssuesResponse>(CREATE_ISSUES_MUTATION, {
      input: issues,
    });
  }

  // Create a project
  async createProject(input: ProjectInput): Promise<ProjectResponse> {
    const { CREATE_PROJECT } = await import("./mutations.js");
    return this.execute<ProjectResponse>(CREATE_PROJECT, { input });
  }

  // Create batch of issues
  async createBatchIssues(
    issues: CreateIssueInput[]
  ): Promise<IssueBatchResponse> {
    const { CREATE_BATCH_ISSUES } = await import("./mutations.js");
    return this.execute<IssueBatchResponse>(CREATE_BATCH_ISSUES, {
      input: { issues },
    });
  }

  // Helper method to create a project with associated issues
  async createProjectWithIssues(
    projectInput: ProjectInput,
    issues: CreateIssueInput[]
  ): Promise<ProjectResponse> {
    // Create project first
    const projectResult = await this.createProject(projectInput);

    if (!projectResult.projectCreate.success) {
      throw new Error("Failed to create project");
    }

    // Then create issues with project ID
    const issuesWithProject = issues.map((issue) => ({
      ...issue,
      projectId: projectResult.projectCreate.project.id,
    }));

    const issuesResult = await this.createBatchIssues(issuesWithProject);

    if (!issuesResult.issueBatchCreate.success) {
      throw new Error("Failed to create issues");
    }

    return {
      projectCreate: projectResult.projectCreate,
      issueBatchCreate: issuesResult.issueBatchCreate,
    };
  }

  // Update a single issue
  async updateIssue(
    id: string,
    input: UpdateIssueInput
  ): Promise<UpdateIssuesResponse> {
    const { UPDATE_ISSUES_MUTATION } = await import("./mutations.js");
    return this.execute<UpdateIssuesResponse>(UPDATE_ISSUES_MUTATION, {
      id,
      input,
    });
  }

  // Bulk update issues - now calls updateIssue for each ID
  async updateIssues(
    ids: string[],
    input: UpdateIssueInput
  ): Promise<UpdateIssuesResponse> {
    // Get the first ID to update
    const firstId = ids[0];
    if (!firstId) {
      throw new Error("No issue IDs provided for update");
    }

    // Update the first issue
    const result = await this.updateIssue(firstId, input);

    // If there are more IDs, update them sequentially
    if (ids.length > 1) {
      for (let i = 1; i < ids.length; i++) {
        await this.updateIssue(ids[i], input);
      }
    }

    // Return the result from the first update
    return result;
  }

  // Create multiple labels
  async createIssueLabels(labels: LabelInput[]): Promise<LabelResponse> {
    const { CREATE_ISSUE_LABELS } = await import("./mutations.js");
    return this.execute<LabelResponse>(CREATE_ISSUE_LABELS, { labels });
  }

  // Search issues with pagination
  async searchIssues(
    filter: SearchIssuesInput["filter"],
    first: number = 50,
    after?: string,
    orderBy: string = "updatedAt"
  ): Promise<SearchIssuesResponse> {
    const { SEARCH_ISSUES_QUERY } = await import("./queries.js");
    return this.execute<SearchIssuesResponse>(SEARCH_ISSUES_QUERY, {
      filter,
      first,
      after,
      orderBy,
    });
  }

  // Get teams with their states and labels
  async getTeams(): Promise<TeamResponse> {
    const { GET_TEAMS_QUERY } = await import("./queries.js");
    return this.execute<TeamResponse>(GET_TEAMS_QUERY);
  }

  // Get current user info
  async getCurrentUser(): Promise<UserResponse> {
    const { GET_USER_QUERY } = await import("./queries.js");
    return this.execute<UserResponse>(GET_USER_QUERY);
  }

  // Get project info
  async getProject(id: string): Promise<ProjectResponse> {
    const { GET_PROJECT_QUERY } = await import("./queries.js");
    return this.execute<ProjectResponse>(GET_PROJECT_QUERY, { id });
  }

  // Search projects
  async searchProjects(filter: {
    name?: { eq: string };
  }): Promise<SearchProjectsResponse> {
    const { SEARCH_PROJECTS_QUERY } = await import("./queries.js");
    return this.execute<SearchProjectsResponse>(SEARCH_PROJECTS_QUERY, {
      filter,
    });
  }

  // Delete a single issue
  async deleteIssue(id: string): Promise<DeleteIssueResponse> {
    const { DELETE_ISSUES_MUTATION } = await import("./mutations.js");
    return this.execute<DeleteIssueResponse>(DELETE_ISSUES_MUTATION, {
      ids: [id],
    });
  }

  // Delete multiple issues
  async deleteIssues(ids: string[]): Promise<DeleteIssueResponse> {
    const { DELETE_ISSUES_MUTATION } = await import("./mutations.js");
    return this.execute<DeleteIssueResponse>(DELETE_ISSUES_MUTATION, { ids });
  }
}
