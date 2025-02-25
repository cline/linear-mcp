import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { LinearGraphQLClient } from '../graphql/client';
import { LinearClient } from '@linear/sdk';
import { 
  CreateIssueInput, 
  CreateIssueResponse,
  CreateIssuesResponse,
  UpdateIssueInput,
  UpdateIssuesResponse,
  SearchIssuesInput,
  SearchIssuesResponse,
  DeleteIssueResponse,
  IssueBatchResponse
} from '../features/issues/types/issue.types';
import {
  ProjectInput,
  ProjectResponse,
  SearchProjectsResponse
} from '../features/projects/types/project.types';
import {
  TeamResponse,
  LabelInput,
  LabelResponse
} from '../features/teams/types/team.types';
import {
  UserResponse
} from '../features/users/types/user.types';

jest.mock('@linear/sdk');

// Define type for GraphQL response
type GraphQLResponse<T> = {
  data: T;
};

describe('LinearGraphQLClient', () => {
  let graphqlClient: LinearGraphQLClient;
  let linearClient: LinearClient;
  let mockRawRequest: jest.MockedFunction<(query: string, variables?: Record<string, unknown>) => Promise<GraphQLResponse<unknown>>>;

  beforeEach(() => {
    mockRawRequest = jest.fn();
    // Mock the Linear client's GraphQL client
    linearClient = {
      client: {
        rawRequest: mockRawRequest
      }
    } as unknown as LinearClient;

    // Clear mocks
    mockRawRequest.mockReset();

    graphqlClient = new LinearGraphQLClient(linearClient);
  });

  describe('searchIssues', () => {
    it('should successfully search issues', async () => {
      const mockResponse = {
        data: {
          issues: {
            pageInfo: {
              hasNextPage: false,
              endCursor: null
            },
            nodes: [
              {
                id: 'issue-1',
                identifier: 'TEST-1',
                title: 'Test Issue 1',
                url: 'https://linear.app/test/issue/TEST-1'
              }
            ]
          }
        }
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const searchInput: SearchIssuesInput = {
        filter: {
          project: {
            id: {
              eq: 'project-1'
            }
          }
        },
        first: 1
      };

      const result: SearchIssuesResponse = await graphqlClient.searchIssues(
        searchInput.filter,
        searchInput.first
      );

      expect(result).toEqual(mockResponse.data);
      expect(mockRawRequest).toHaveBeenCalled();
    });

    it('should handle search errors', async () => {
      mockRawRequest.mockRejectedValueOnce(new Error('Search failed'));

      const searchInput: SearchIssuesInput = {
        filter: {
          project: {
            id: {
              eq: 'project-1'
            }
          }
        }
      };

      await expect(
        graphqlClient.searchIssues(searchInput.filter)
      ).rejects.toThrow('GraphQL operation failed: Search failed');
    });
  });

  describe('createIssue', () => {
    it('should successfully create an issue', async () => {
      const mockResponse = {
        data: {
          issueCreate: {
            success: true,
            issue: {
              id: 'issue-1',
              identifier: 'TEST-1',
              title: 'New Issue',
              url: 'https://linear.app/test/issue/TEST-1'
            }
          }
        }
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const input: CreateIssueInput = {
        title: 'New Issue',
        description: 'Description',
        teamId: 'team-1'
      };
      
      const result: CreateIssueResponse = await graphqlClient.createIssue(input);

      // Verify single mutation call with array input
      expect(mockRawRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          input: input
        })
      );

      expect(result).toEqual(mockResponse.data);
      expect(mockRawRequest).toHaveBeenCalled();
    });

    it('should handle creation errors', async () => {
      mockRawRequest.mockRejectedValueOnce(new Error('Creation failed'));

      const input: CreateIssueInput = {
        title: 'New Issue',
        description: 'Description',
        teamId: 'team-1'
      };

      await expect(
        graphqlClient.createIssue(input)
      ).rejects.toThrow('GraphQL operation failed: Creation failed');
    });
  });

  describe('Project Operations', () => {
    describe('createProject', () => {
      it('should successfully create a project', async () => {
        const mockResponse = {
          data: {
            projectCreate: {
              success: true,
              project: {
                id: 'project-1',
                name: 'New Project',
                url: 'https://linear.app/test/project/1'
              },
              lastSyncId: 123
            }
          }
        };

        mockRawRequest.mockResolvedValueOnce(mockResponse);

        const projectInput: ProjectInput = {
          name: 'New Project',
          teamIds: ['team-1']
        };

        const result = await graphqlClient.createProject(projectInput);
        expect(result).toEqual(mockResponse.data);
        expect(mockRawRequest).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ input: projectInput })
        );
      });
    });

    describe('createProjectWithIssues', () => {
      it('should successfully create project with issues', async () => {
        const projectMockResponse = {
          data: {
            projectCreate: {
              success: true,
              project: {
                id: 'project-1',
                name: 'New Project',
                url: 'https://linear.app/test/project/1'
              },
              lastSyncId: 123
            }
          }
        };

        const issueMockResponse = {
          data: {
            issueBatchCreate: {
              success: true,
              issues: [
                {
                  id: 'issue-1',
                  identifier: 'TEST-1',
                  title: 'Project Issue 1',
                  url: 'https://linear.app/test/issue/TEST-1'
                }
              ],
              lastSyncId: 124
            }
          }
        };

        mockRawRequest
          .mockResolvedValueOnce(projectMockResponse)
          .mockResolvedValueOnce(issueMockResponse);

        const projectInput: ProjectInput = {
          name: 'New Project',
          teamIds: ['team-1']
        };

        const issueInput: CreateIssueInput = {
          title: 'Project Issue 1',
          description: 'Description 1',
          teamId: 'team-1'
        };

        const result = await graphqlClient.createProjectWithIssues(
          projectInput,
          [issueInput]
        );

        expect(result).toEqual({
          projectCreate: projectMockResponse.data.projectCreate,
          issueBatchCreate: issueMockResponse.data.issueBatchCreate
        });

        // Verify project creation call
        expect(mockRawRequest).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ input: projectInput })
        );

        // Verify issue creation call
        expect(mockRawRequest).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            input: {
              issues: [{ ...issueInput, projectId: 'project-1' }]
            }
          })
        );
      });

      it('should handle project creation errors', async () => {
        const errorResponse = {
          data: {
            projectCreate: {
              success: false,
              project: null,
              lastSyncId: 123
            }
          }
        };

        mockRawRequest.mockResolvedValueOnce(errorResponse);

        const projectInput: ProjectInput = {
          name: 'New Project',
          teamIds: ['team-1']
        };

        const issueInput: CreateIssueInput = {
          title: 'Project Issue 1',
          description: 'Description 1',
          teamId: 'team-1'
        };

        await expect(
          graphqlClient.createProjectWithIssues(projectInput, [issueInput])
        ).rejects.toThrow('Failed to create project');
      });

      it('should handle issue creation errors', async () => {
        const projectResponse = {
          data: {
            projectCreate: {
              success: true,
              project: {
                id: 'project-1',
                name: 'New Project',
                url: 'https://linear.app/test/project/1'
              },
              lastSyncId: 123
            }
          }
        };

        const errorResponse = {
          data: {
            issueBatchCreate: {
              success: false,
              issues: [],
              lastSyncId: 124
            }
          }
        };

        mockRawRequest
          .mockResolvedValueOnce(projectResponse)
          .mockResolvedValueOnce(errorResponse);

        const projectInput: ProjectInput = {
          name: 'New Project',
          teamIds: ['team-1']
        };

        const issueInput: CreateIssueInput = {
          title: 'Project Issue 1',
          description: 'Description 1',
          teamId: 'team-1'
        };

        await expect(
          graphqlClient.createProjectWithIssues(projectInput, [issueInput])
        ).rejects.toThrow('Failed to create issues');
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should create multiple issues with a single mutation', async () => {
      const mockResponse = {
        data: {
          issueCreate: {
            success: true,
            issues: [
              {
                id: 'issue-1',
                identifier: 'TEST-1',
                title: 'Issue 1',
                url: 'https://linear.app/test/issue/TEST-1'
              },
              {
                id: 'issue-2',
                identifier: 'TEST-2',
                title: 'Issue 2',
                url: 'https://linear.app/test/issue/TEST-2'
              }
            ]
          }
        }
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const issues: CreateIssueInput[] = [
        {
          title: 'Issue 1',
          description: 'Description 1',
          teamId: 'team-1'
        },
        {
          title: 'Issue 2',
          description: 'Description 2',
          teamId: 'team-1'
        }
      ];

      const result: IssueBatchResponse = await graphqlClient.createIssues(issues);

      expect(result).toEqual(mockResponse.data);
      // Verify single mutation call
      expect(mockRawRequest).toHaveBeenCalledTimes(1);
      expect(mockRawRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          input: { issues }
        })
      );
    });

    it('should update multiple issues with a single mutation', async () => {
      const mockResponse = {
        data: {
          issueUpdate: {
            success: true,
            issues: [
              {
                id: 'issue-1',
                identifier: 'TEST-1',
                title: 'Updated Issue 1',
                url: 'https://linear.app/test/issue/TEST-1'
              },
              {
                id: 'issue-2',
                identifier: 'TEST-2',
                title: 'Updated Issue 2',
                url: 'https://linear.app/test/issue/TEST-2'
              }
            ]
          }
        }
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const ids = ['issue-1', 'issue-2'];
      const updateInput: UpdateIssueInput = { stateId: 'state-2' };
      const result: UpdateIssuesResponse = await graphqlClient.updateIssues(ids, updateInput);

      expect(result).toEqual(mockResponse.data);
      // Verify single mutation call
      expect(mockRawRequest).toHaveBeenCalledTimes(1);
      expect(mockRawRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ids,
          input: updateInput
        })
      );
    });

    it('should handle update errors', async () => {
      mockRawRequest.mockRejectedValueOnce(new Error('Update failed'));

      const updateInput: UpdateIssueInput = { stateId: 'state-2' };
      await expect(
        graphqlClient.updateIssues(['issue-1'], updateInput)
      ).rejects.toThrow('GraphQL operation failed: Update failed');
    });

    it('should delete multiple issues with a single mutation', async () => {
      const mockResponse = {
        data: {
          issueDelete: {
            success: true
          }
        }
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const ids = ['issue-1', 'issue-2'];
      const result: DeleteIssueResponse = await graphqlClient.deleteIssues(ids);

      expect(result).toEqual(mockResponse.data);
      // Verify single mutation call
      expect(mockRawRequest).toHaveBeenCalledTimes(1);
      expect(mockRawRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ids
        })
      );
    });
  });

  describe('getTeams', () => {
    it('should successfully fetch teams', async () => {
      const mockResponse = {
        data: {
          teams: {
            nodes: [
              {
                id: 'team-1',
                name: 'Team 1',
                key: 'TEAM1',
                states: [
                  {
                    id: 'state-1',
                    name: 'Todo',
                    type: 'unstarted'
                  }
                ]
              }
            ]
          }
        }
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const result: TeamResponse = await graphqlClient.getTeams();

      expect(result).toEqual(mockResponse.data);
      expect(mockRawRequest).toHaveBeenCalled();
    });

    it('should handle team fetch errors', async () => {
      mockRawRequest.mockRejectedValueOnce(new Error('Team fetch failed'));

      await expect(graphqlClient.getTeams()).rejects.toThrow(
        'GraphQL operation failed: Team fetch failed'
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should successfully fetch current user', async () => {
      const mockResponse = {
        data: {
          viewer: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com'
          }
        }
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const result: UserResponse = await graphqlClient.getCurrentUser();

      expect(result).toEqual(mockResponse.data);
      expect(mockRawRequest).toHaveBeenCalled();
    });

    it('should handle user fetch errors', async () => {
      mockRawRequest.mockRejectedValueOnce(new Error('User fetch failed'));

      await expect(graphqlClient.getCurrentUser()).rejects.toThrow(
        'GraphQL operation failed: User fetch failed'
      );
    });
  });

  describe('Label Operations', () => {
    it('should successfully create labels', async () => {
      const mockResponse = {
        data: {
          labelCreate: {
            success: true,
            label: {
              id: 'label-1',
              name: 'bug'
            }
          }
        }
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const labelInput: LabelInput = {
        name: 'bug',
        color: '#FF0000',
        teamId: 'team-1'
      };

      const result: LabelResponse = await graphqlClient.createIssueLabels([labelInput]);

      expect(result).toEqual(mockResponse.data);
      expect(mockRawRequest).toHaveBeenCalled();
    });

    it('should handle label creation errors', async () => {
      mockRawRequest.mockRejectedValueOnce(new Error('Label creation failed'));

      const labelInput: LabelInput = {
        name: 'bug',
        teamId: 'team-1'
      };

      await expect(
        graphqlClient.createIssueLabels([labelInput])
      ).rejects.toThrow('GraphQL operation failed: Label creation failed');
    });
  });
});
