#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  GitLabForkSchema,
  GitLabReferenceSchema,
  GitLabRepositorySchema,
  GitLabIssueSchema,
  GitLabMergeRequestSchema,
  GitLabContentSchema,
  GitLabCreateUpdateFileResponseSchema,
  GitLabSearchResponseSchema,
  GitLabTreeSchema,
  GitLabCommitSchema,
  CreateRepositoryOptionsSchema,
  CreateIssueOptionsSchema,
  CreateMergeRequestOptionsSchema,
  CreateBranchOptionsSchema,
  CreateOrUpdateFileSchema,
  SearchRepositoriesSchema,
  CreateRepositorySchema,
  GetFileContentsSchema,
  PushFilesSchema,
  CreateIssueSchema,
  CreateMergeRequestSchema,
  ForkRepositorySchema,
  CreateBranchSchema,
  type GitLabFork,
  type GitLabReference,
  type GitLabRepository,
  type GitLabIssue,
  type GitLabMergeRequest,
  type GitLabContent,
  type GitLabCreateUpdateFileResponse,
  type GitLabSearchResponse,
  type GitLabTree,
  type GitLabCommit,
  type FileOperation,
  CommentMergeRequestSchema,
  GitLabComment,
  GitLabCommentSchema,
  GitLabMergeRequestChangesSchema,
  GetMergeRequestChangesSchema,
  GitLabMergeRequestChange,
  GitLabApproval,
  GitLabApprovalSchema,
  ApproveMergeRequestSchema,
  UnapproveMergeRequestSchema,
} from "./schemas.js";

const server = new Server(
  {
    name: "gitlab-mcp-server",
    version: "0.5.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const GITLAB_PERSONAL_ACCESS_TOKEN = process.env.GITLAB_PERSONAL_ACCESS_TOKEN;
const GITLAB_API_URL =
  process.env.GITLAB_API_URL || "https://gitlab.com/api/v4";

if (!GITLAB_PERSONAL_ACCESS_TOKEN) {
  console.error("GITLAB_PERSONAL_ACCESS_TOKEN environment variable is not set");
  process.exit(1);
}

async function forkProject(
  projectId: string,
  namespace?: string
): Promise<GitLabFork> {
  const url = `${GITLAB_API_URL}/projects/${encodeURIComponent(
    projectId
  )}/fork`;
  const queryParams = namespace
    ? `?namespace=${encodeURIComponent(namespace)}`
    : "";

  const response = await fetch(url + queryParams, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabForkSchema.parse(await response.json());
}

async function createBranch(
  projectId: string,
  options: z.infer<typeof CreateBranchOptionsSchema>
): Promise<GitLabReference> {
  const response = await fetch(
    `${GITLAB_API_URL}/projects/${encodeURIComponent(
      projectId
    )}/repository/branches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branch: options.name,
        ref: options.ref,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabReferenceSchema.parse(await response.json());
}

async function getDefaultBranchRef(projectId: string): Promise<string> {
  const response = await fetch(
    `${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}`,
    {
      headers: {
        Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  const project = GitLabRepositorySchema.parse(await response.json());
  return project.default_branch;
}

async function getFileContents(
  projectId: string,
  filePath: string,
  ref: string
): Promise<GitLabContent> {
  const encodedPath = encodeURIComponent(filePath);
  let url = `${GITLAB_API_URL}/projects/${encodeURIComponent(
    projectId
  )}/repository/files/${encodedPath}?ref=${encodeURIComponent(ref)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  const data = GitLabContentSchema.parse(await response.json());

  if (!Array.isArray(data) && data.content) {
    data.content = Buffer.from(data.content, "base64").toString("utf8");
  }

  return data;
}

async function createIssue(
  projectId: string,
  options: z.infer<typeof CreateIssueOptionsSchema>
): Promise<GitLabIssue> {
  const response = await fetch(
    `${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: options.title,
        description: options.description,
        assignee_ids: options.assignee_ids,
        milestone_id: options.milestone_id,
        labels: options.labels?.join(","),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabIssueSchema.parse(await response.json());
}

async function createMergeRequest(
  projectId: string,
  options: z.infer<typeof CreateMergeRequestOptionsSchema>
): Promise<GitLabMergeRequest> {
  const response = await fetch(
    `${GITLAB_API_URL}/projects/${encodeURIComponent(
      projectId
    )}/merge_requests`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: options.title,
        description: options.description,
        source_branch: options.source_branch,
        target_branch: options.target_branch,
        allow_collaboration: options.allow_collaboration,
        draft: options.draft,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabMergeRequestSchema.parse(await response.json());
}

async function createOrUpdateFile(
  projectId: string,
  filePath: string,
  content: string,
  commitMessage: string,
  branch: string,
  previousPath?: string
): Promise<GitLabCreateUpdateFileResponse> {
  const encodedPath = encodeURIComponent(filePath);
  const url = `${GITLAB_API_URL}/projects/${encodeURIComponent(
    projectId
  )}/repository/files/${encodedPath}`;

  const body = {
    branch,
    content,
    commit_message: commitMessage,
    ...(previousPath ? { previous_path: previousPath } : {}),
  };

  // Check if file exists
  let method = "POST";
  try {
    await getFileContents(projectId, filePath, branch);
    method = "PUT";
  } catch (error) {
    // File doesn't exist, use POST
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabCreateUpdateFileResponseSchema.parse(await response.json());
}

async function createTree(
  projectId: string,
  files: FileOperation[],
  ref?: string
): Promise<GitLabTree> {
  const response = await fetch(
    `${GITLAB_API_URL}/projects/${encodeURIComponent(
      projectId
    )}/repository/tree`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: files.map((file) => ({
          file_path: file.path,
          content: file.content,
        })),
        ...(ref ? { ref } : {}),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabTreeSchema.parse(await response.json());
}

async function createCommit(
  projectId: string,
  message: string,
  branch: string,
  actions: FileOperation[]
): Promise<GitLabCommit> {
  const response = await fetch(
    `${GITLAB_API_URL}/projects/${encodeURIComponent(
      projectId
    )}/repository/commits`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branch,
        commit_message: message,
        actions: actions.map((action) => ({
          action: "create",
          file_path: action.path,
          content: action.content,
        })),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabCommitSchema.parse(await response.json());
}

async function searchProjects(
  query: string,
  page: number = 1,
  perPage: number = 20
): Promise<GitLabSearchResponse> {
  const url = new URL(`${GITLAB_API_URL}/projects`);
  url.searchParams.append("search", query);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("per_page", perPage.toString());

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  const projects = await response.json();
  return GitLabSearchResponseSchema.parse({
    count: parseInt(response.headers.get("X-Total") || "0"),
    items: projects,
  });
}

async function createRepository(
  options: z.infer<typeof CreateRepositoryOptionsSchema>
): Promise<GitLabRepository> {
  const response = await fetch(`${GITLAB_API_URL}/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: options.name,
      description: options.description,
      visibility: options.visibility,
      initialize_with_readme: options.initialize_with_readme,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabRepositorySchema.parse(await response.json());
}

async function commentMergeRequest(
  projectId: string,
  mergeRequestId: string,
  body: string
): Promise<GitLabComment> {
  const response = await fetch(
    `${GITLAB_API_URL}/projects/${encodeURIComponent(
      projectId
    )}/merge_requests/${mergeRequestId}/notes`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabCommentSchema.parse(await response.json());
}

/**
 * Helper function to summarize merge request changes into a more readable format
 * @param {object} changes - The raw changes object from GitLab API
 * @returns {object} A summarized version of the changes
 */
function summarizeMergeRequestChanges(changes: GitLabMergeRequestChange) {
  return {
    summary: {
      total_files_changed: changes.changes.length,
      files_added: changes.changes.filter((f) => f.new_file).length,
      files_deleted: changes.changes.filter((f) => f.deleted_file).length,
      files_renamed: changes.changes.filter((f) => f.renamed_file).length,
      files_modified: changes.changes.filter(
        (f) => !f.new_file && !f.deleted_file && !f.renamed_file
      ).length,
    },
    file_changes: changes.changes.map((file) => ({
      old_path: file.old_path,
      new_path: file.new_path,
      change_type: file.new_file
        ? "added"
        : file.deleted_file
        ? "deleted"
        : file.renamed_file
        ? "renamed"
        : "modified",
      diff_preview:
        file.diff.split("\n").slice(0, 3).join("\n") +
        (file.diff.split("\n").length > 3 ? "\n..." : ""),
    })),
    commits: changes.commits || [],
  };
}

/**
 * Get changes (diff) for a specific merge request in a GitLab project
 * @param {string} projectId - The ID or URL-encoded path of the project
 * @param {string} mergeRequestId - The IID of the merge request
 * @returns {Promise<object>} The merge request changes including diffs
 */
async function getMergeRequestChanges(
  projectId: string,
  mergeRequestId: string,
  accessRawDiffs: boolean | undefined,
  withStats: boolean | undefined
) {
  try {
    let url = `${GITLAB_API_URL}/projects/${encodeURIComponent(
      projectId
    )}/merge_requests/${mergeRequestId}/changes`;
    const queryParams = new URLSearchParams();

    if (accessRawDiffs) {
      queryParams.append("access_raw_diffs", "true");
    }

    if (withStats) {
      queryParams.append("with_stats", "true");
    }

    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    // Make the API request with the constructed URL
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `GitLab API error: ${response.statusText} - ${errorBody}`
      );
    }

    const data = await response.json();
    return GitLabMergeRequestChangesSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid response format: ${error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`
      );
    }
    throw error;
  }
}

async function approveMergeRequest(
  projectId: string,
  mergeRequestId: string
): Promise<GitLabApproval> {
  const response = await fetch(
    `${GITLAB_API_URL}/projects/${encodeURIComponent(
      projectId
    )}/merge_requests/${mergeRequestId}/approve`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabApprovalSchema.parse(await response.json());
}

async function unapproveMergeRequest(
  projectId: string,
  mergeRequestId: string
): Promise<GitLabApproval> {
  const response = await fetch(
    `${GITLAB_API_URL}/projects/${encodeURIComponent(
      projectId
    )}/merge_requests/${mergeRequestId}/unapprove`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return GitLabApprovalSchema.parse(await response.json());
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_or_update_file",
        description: "Create or update a single file in a GitLab project",
        inputSchema: zodToJsonSchema(CreateOrUpdateFileSchema),
      },
      {
        name: "search_repositories",
        description: "Search for GitLab projects",
        inputSchema: zodToJsonSchema(SearchRepositoriesSchema),
      },
      {
        name: "create_repository",
        description: "Create a new GitLab project",
        inputSchema: zodToJsonSchema(CreateRepositorySchema),
      },
      {
        name: "get_file_contents",
        description:
          "Get the contents of a file or directory from a GitLab project",
        inputSchema: zodToJsonSchema(GetFileContentsSchema),
      },
      {
        name: "push_files",
        description:
          "Push multiple files to a GitLab project in a single commit",
        inputSchema: zodToJsonSchema(PushFilesSchema),
      },
      {
        name: "create_issue",
        description: "Create a new issue in a GitLab project",
        inputSchema: zodToJsonSchema(CreateIssueSchema),
      },
      {
        name: "create_merge_request",
        description: "Create a new merge request in a GitLab project",
        inputSchema: zodToJsonSchema(CreateMergeRequestSchema),
      },
      {
        name: "fork_repository",
        description:
          "Fork a GitLab project to your account or specified namespace",
        inputSchema: zodToJsonSchema(ForkRepositorySchema),
      },
      {
        name: "create_branch",
        description: "Create a new branch in a GitLab project",
        inputSchema: zodToJsonSchema(CreateBranchSchema),
      },
      {
        name: "comment_merge_request",
        description: "Comment a merge request in a GitLab project",
        inputSchema: zodToJsonSchema(CommentMergeRequestSchema),
      },
      {
        name: "get_merge_request_changes",
        description:
          "Get the changes (diff) from a merge request in a GitLab project. Returns file changes with diffs, commit info, and optionally statistics.",
        inputSchema: zodToJsonSchema(GetMergeRequestChangesSchema),
      },
      {
        name: "approve_merge_request",
        description: "Approve a merge request",
        inputSchema: zodToJsonSchema(ApproveMergeRequestSchema),
      },
      {
        name: "unapprove_merge_request",
        description: "Unapprove a merge request",
        inputSchema: zodToJsonSchema(UnapproveMergeRequestSchema),
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    switch (request.params.name) {
      case "fork_repository": {
        const args = ForkRepositorySchema.parse(request.params.arguments);
        const fork = await forkProject(args.project_id, args.namespace);
        return {
          content: [{ type: "text", text: JSON.stringify(fork, null, 2) }],
        };
      }

      case "create_branch": {
        const args = CreateBranchSchema.parse(request.params.arguments);
        let ref = args.ref;
        if (!ref) {
          ref = await getDefaultBranchRef(args.project_id);
        }

        const branch = await createBranch(args.project_id, {
          name: args.branch,
          ref,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(branch, null, 2) }],
        };
      }

      case "search_repositories": {
        const args = SearchRepositoriesSchema.parse(request.params.arguments);
        const results = await searchProjects(
          args.search,
          args.page,
          args.per_page
        );
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "create_repository": {
        const args = CreateRepositorySchema.parse(request.params.arguments);
        const repository = await createRepository(args);
        return {
          content: [
            { type: "text", text: JSON.stringify(repository, null, 2) },
          ],
        };
      }

      case "get_file_contents": {
        const args = GetFileContentsSchema.parse(request.params.arguments);
        const contents = await getFileContents(
          args.project_id,
          args.file_path,
          args.ref
        );
        return {
          content: [{ type: "text", text: JSON.stringify(contents, null, 2) }],
        };
      }

      case "create_or_update_file": {
        const args = CreateOrUpdateFileSchema.parse(request.params.arguments);
        const result = await createOrUpdateFile(
          args.project_id,
          args.file_path,
          args.content,
          args.commit_message,
          args.branch,
          args.previous_path
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "push_files": {
        const args = PushFilesSchema.parse(request.params.arguments);
        const result = await createCommit(
          args.project_id,
          args.commit_message,
          args.branch,
          args.files.map((f) => ({ path: f.file_path, content: f.content }))
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "create_issue": {
        const args = CreateIssueSchema.parse(request.params.arguments);
        const { project_id, ...options } = args;
        const issue = await createIssue(project_id, options);
        return {
          content: [{ type: "text", text: JSON.stringify(issue, null, 2) }],
        };
      }

      case "create_merge_request": {
        const args = CreateMergeRequestSchema.parse(request.params.arguments);
        const { project_id, ...options } = args;
        const mergeRequest = await createMergeRequest(project_id, options);
        return {
          content: [
            { type: "text", text: JSON.stringify(mergeRequest, null, 2) },
          ],
        };
      }

      case "comment_merge_request": {
        const args = CommentMergeRequestSchema.parse(request.params.arguments);
        const { project_id, merge_request_id, body } = args;
        const comment = await commentMergeRequest(
          project_id,
          merge_request_id,
          body
        );
        return {
          content: [{ type: "text", text: JSON.stringify(comment, null, 2) }],
        };
      }

      // Then update the handler case:
      case "get_merge_request_changes": {
        const args = GetMergeRequestChangesSchema.parse(
          request.params.arguments
        );
        const { project_id, merge_request_id, access_raw_diffs, with_stats } =
          args;

        const changes = await getMergeRequestChanges(
          project_id,
          merge_request_id,
          access_raw_diffs,
          with_stats
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  raw_changes: changes,
                  summary: summarizeMergeRequestChanges(changes),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "approve_merge_request": {
        const args = ApproveMergeRequestSchema.parse(request.params.arguments);
        const { project_id, merge_request_id } = args;
        const approval = await approveMergeRequest(
          project_id,
          merge_request_id
        );
        return {
          content: [{ type: "text", text: JSON.stringify(approval, null, 2) }],
        };
      }

      case "unapprove_merge_request": {
        const args = UnapproveMergeRequestSchema.parse(
          request.params.arguments
        );
        const { project_id, merge_request_id } = args;
        const approval = await unapproveMergeRequest(
          project_id,
          merge_request_id
        );
        return {
          content: [{ type: "text", text: JSON.stringify(approval, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid arguments: ${error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`
      );
    }
    throw error;
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GitLab MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
