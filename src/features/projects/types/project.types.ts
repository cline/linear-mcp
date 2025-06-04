/**
 * Project operation types
 * These types define the structure for project-related operations in Linear
 */

/**
 * Document content structure for rich text descriptions
 */
export interface DocumentContent {
  /** Markdown/plain text version of the content */
  content?: string;
  /** Document state information for rich text formatting */
  contentState?: string;
}

/**
 * Project information with proper description handling
 */
export interface Project {
  id: string;
  name: string;
  /** Legacy description field (usually empty) */
  description?: string;
  /** Rich content description field (actual content) */
  documentContent?: DocumentContent;
  url: string;
  teams?: {
    nodes: Array<{
      id: string;
      name: string;
    }>;
  };
}

/**
 * Utility function to get the actual project description
 * Prioritizes documentContent.content over legacy description field
 */
export function getProjectDescription(project: Project): string {
  return project.documentContent?.content || project.description || '';
}

/**
 * Input for creating a new project
 * @example
 * ```typescript
 * const projectInput: ProjectInput = {
 *   name: "Q1 Planning",
 *   description: "Q1 2025 Planning Project",
 *   teamIds: ["team-id-1", "team-id-2"], // Required: Array of team IDs this project belongs to
 *   state: "started" // Optional: Project state
 * };
 * ```
 */
export interface ProjectInput {
  /** The name of the project */
  name: string;

  /** Optional description of the project */
  description?: string;

  /**
   * Array of team IDs this project belongs to
   * @required
   * Note: Linear API requires teamIds (array) not teamId (single value)
   */
  teamIds: string[];

  /** Optional project state */
  state?: string;
}

export interface ProjectResponse {
  projectCreate: {
    success: boolean;
    project: Project;
    lastSyncId: number;
  };
  issueBatchCreate?: {
    success: boolean;
    issues: Array<{
      id: string;
      identifier: string;
      title: string;
      url: string;
    }>;
    lastSyncId: number;
  };
}

export interface SearchProjectsResponse {
  projects: {
    nodes: Project[];
  };
}

export interface GetProjectResponse {
  project: Project;
}