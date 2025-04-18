import { z } from "zod";

// Base schemas for common types
export const GitLabAuthorSchema = z.object({
  name: z.string(),
  email: z.string(),
  date: z.string(),
});

// Repository related schemas
export const GitLabOwnerSchema = z.object({
  username: z.string(), // Changed from login to match GitLab API
  id: z.number(),
  avatar_url: z.string(),
  web_url: z.string(), // Changed from html_url to match GitLab API
  name: z.string(), // Added as GitLab includes full name
  state: z.string(), // Added as GitLab includes user state
});

export const GitLabRepositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  path_with_namespace: z.string(), // Changed from full_name to match GitLab API
  visibility: z.string(), // Changed from private to match GitLab API
  owner: GitLabOwnerSchema.optional(),
  web_url: z.string(), // Changed from html_url to match GitLab API
  description: z.string().nullable(),
  fork: z.boolean().optional(),
  ssh_url_to_repo: z.string(), // Changed from ssh_url to match GitLab API
  http_url_to_repo: z.string(), // Changed from clone_url to match GitLab API
  created_at: z.string(),
  last_activity_at: z.string(), // Changed from updated_at to match GitLab API
  default_branch: z.string(),
});

// File content schemas
export const GitLabFileContentSchema = z.object({
  file_name: z.string(), // Changed from name to match GitLab API
  file_path: z.string(), // Changed from path to match GitLab API
  size: z.number(),
  encoding: z.string(),
  content: z.string(),
  content_sha256: z.string(), // Changed from sha to match GitLab API
  ref: z.string(), // Added as GitLab requires branch reference
  blob_id: z.string(), // Added to match GitLab API
  last_commit_id: z.string(), // Added to match GitLab API
});

export const GitLabDirectoryContentSchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.string(),
  mode: z.string(),
  id: z.string(), // Changed from sha to match GitLab API
  web_url: z.string(), // Changed from html_url to match GitLab API
});

export const GitLabContentSchema = z.union([
  GitLabFileContentSchema,
  z.array(GitLabDirectoryContentSchema),
]);

// Operation schemas
export const FileOperationSchema = z.object({
  path: z.string(),
  content: z.string(),
});

// Tree and commit schemas
export const GitLabTreeEntrySchema = z.object({
  id: z.string(), // Changed from sha to match GitLab API
  name: z.string(),
  type: z.enum(["blob", "tree"]),
  path: z.string(),
  mode: z.string(),
});

export const GitLabTreeSchema = z.object({
  id: z.string(), // Changed from sha to match GitLab API
  tree: z.array(GitLabTreeEntrySchema),
});

export const GitLabCommitSchema = z.object({
  id: z.string(), // Changed from sha to match GitLab API
  short_id: z.string(), // Added to match GitLab API
  title: z.string(), // Changed from message to match GitLab API
  author_name: z.string(),
  author_email: z.string(),
  authored_date: z.string(),
  committer_name: z.string(),
  committer_email: z.string(),
  committed_date: z.string(),
  web_url: z.string(), // Changed from html_url to match GitLab API
  parent_ids: z.array(z.string()), // Changed from parents to match GitLab API
});

// Reference schema
export const GitLabReferenceSchema = z.object({
  name: z.string(), // Changed from ref to match GitLab API
  commit: z.object({
    id: z.string(), // Changed from sha to match GitLab API
    web_url: z.string(), // Changed from url to match GitLab API
  }),
});

// Input schemas for operations
export const CreateRepositoryOptionsSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  visibility: z.enum(["private", "internal", "public"]).optional(), // Changed from private to match GitLab API
  initialize_with_readme: z.boolean().optional(), // Changed from auto_init to match GitLab API
});

export const CreateIssueOptionsSchema = z.object({
  title: z.string(),
  description: z.string().optional(), // Changed from body to match GitLab API
  assignee_ids: z.array(z.number()).optional(), // Changed from assignees to match GitLab API
  milestone_id: z.number().optional(), // Changed from milestone to match GitLab API
  labels: z.array(z.string()).optional(),
});

export const CreateMergeRequestOptionsSchema = z.object({
  // Changed from CreatePullRequestOptionsSchema
  title: z.string(),
  description: z.string().optional(), // Changed from body to match GitLab API
  source_branch: z.string(), // Changed from head to match GitLab API
  target_branch: z.string(), // Changed from base to match GitLab API
  allow_collaboration: z.boolean().optional(), // Changed from maintainer_can_modify to match GitLab API
  draft: z.boolean().optional(),
});

export const CreateBranchOptionsSchema = z.object({
  name: z.string(), // Changed from ref to match GitLab API
  ref: z.string(), // The source branch/commit for the new branch
});

// Response schemas for operations
export const GitLabCreateUpdateFileResponseSchema = z.object({
  file_path: z.string(),
  branch: z.string(),
  commit_id: z.string(), // Changed from sha to match GitLab API
  content: GitLabFileContentSchema.optional(),
});

export const GitLabSearchResponseSchema = z.object({
  count: z.number(), // Changed from total_count to match GitLab API
  items: z.array(GitLabRepositorySchema),
});

// Fork related schemas
export const GitLabForkParentSchema = z.object({
  name: z.string(),
  path_with_namespace: z.string(), // Changed from full_name to match GitLab API
  owner: z.object({
    username: z.string(), // Changed from login to match GitLab API
    id: z.number(),
    avatar_url: z.string(),
  }),
  web_url: z.string(), // Changed from html_url to match GitLab API
});

export const GitLabForkSchema = GitLabRepositorySchema.extend({
  forked_from_project: GitLabForkParentSchema, // Changed from parent to match GitLab API
});

// Issue related schemas
export const GitLabLabelSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
  description: z.string().optional(),
});

export const GitLabUserSchema = z.object({
  username: z.string(), // Changed from login to match GitLab API
  id: z.number(),
  name: z.string(),
  avatar_url: z.string(),
  web_url: z.string(), // Changed from html_url to match GitLab API
  // state: z.string(),
});

export const GitLabMilestoneSchema = z.object({
  id: z.number(),
  iid: z.number(), // Added to match GitLab API
  title: z.string(),
  description: z.string(),
  state: z.string(),
  web_url: z.string(), // Changed from html_url to match GitLab API
});

export const GitLabIssueSchema = z.object({
  id: z.number(),
  iid: z.number(), // Added to match GitLab API
  project_id: z.number(), // Added to match GitLab API
  title: z.string(),
  description: z.string(), // Changed from body to match GitLab API
  // state: z.string(),
  author: GitLabUserSchema,
  assignees: z.array(GitLabUserSchema),
  labels: z.array(GitLabLabelSchema),
  milestone: GitLabMilestoneSchema.nullable(),
  // created_at: z.string(),
  // updated_at: z.string(),
  // closed_at: z.string().nullable(),
  web_url: z.string(), // Changed from html_url to match GitLab API
});

// Merge Request related schemas (equivalent to Pull Request)
export const GitLabMergeRequestDiffRefSchema = z.object({
  base_sha: z.string(),
  head_sha: z.string(),
  start_sha: z.string(),
});

export const GitLabMergeRequestSchema = z.object({
  id: z.number(),
  iid: z.number(), // Added to match GitLab API
  project_id: z.number(), // Added to match GitLab API
  title: z.string(),
  description: z.string(), // Changed from body to match GitLab API
  // state: z.string(),
  merged: z.boolean().optional(),
  author: GitLabUserSchema,
  assignees: z.array(GitLabUserSchema),
  source_branch: z.string(), // Changed from head to match GitLab API
  target_branch: z.string(), // Changed from base to match GitLab API
  diff_refs: GitLabMergeRequestDiffRefSchema.nullable(),
  web_url: z.string(), // Changed from html_url to match GitLab API
  // created_at: z.string(),
  // updated_at: z.string(),
  // merged_at: z.string().nullable(),
  // closed_at: z.string().nullable(),
  merge_commit_sha: z.string().nullable(),
});

export const GitLabNoteSchema = z.object({
  id: z.number().describe("Unique ID of the note"),
  body: z.string().describe("Content of the note"),
  author: GitLabUserSchema,
  // created_at: z.string().describe("Timestamp when the note was created"),
  // updated_at: z.string().describe("Timestamp when the note was last updated"),
  system: z.boolean().describe("True if it's a system-generated note"),
  noteable_id: z.number().describe("ID of the item the note is attached to"),
  noteable_type: z
    .enum(["Issue", "MergeRequest", "Epic"])
    .describe("Type of item the note is related to, e.g., 'MergeRequest'"),
  project_id: z.number().describe("ID of the associated project"),
  noteable_iid: z
    .number()
    .nullable()
    .describe("Internal ID of the noteable item (nullable)"),
  resolvable: z.boolean().describe("True if the note is resolvable"),
  // confidential: z.boolean().describe("The confidential flag of a note."),
  // internal: z
  //   .boolean()
  //   .describe("The internal flag of a note. Same as 'confidential'"),
});

export const GitLabApprovalSchema = z.object({
  id: z.number(),
  iid: z.number(),
  project_id: z.number(),
  title: z.string(),
  description: z.string(),
  state: z.string(),
  // created_at: z.string(),
  // updated_at: z.string(),
  merge_status: z.string(),
  approvals_required: z.number(),
  approvals_left: z.number(),
  approved_by: z.array(z.object({ user: GitLabUserSchema })),
});

export const GitLabMergeRequestDiffsSchema = z.array(
  z.object({
    old_path: z.string().describe("Old path of the file."),
    new_path: z.string().describe("New path of the file."),
    a_mode: z.string().describe("Old file mode of the file."),
    b_mode: z.string().describe("New file mode of the file."),
    diff: z
      .string()
      .describe("Diff representation of the changes made to the file."),
    new_file: z
      .boolean()
      .describe("Indicates if the file has just been added."),
    renamed_file: z
      .boolean()
      .describe("Indicates if the file has been renamed."),
    deleted_file: z
      .boolean()
      .describe("Indicates if the file has been removed."),
    generated_file: z
      .boolean()
      .describe("Indicates if the file is marked as generated."),
  })
);

export const GitLabMergeRequestRawDiffsSchema = z
  .string()
  .describe("Raw diff response to use programmatically");

const GitLabThreadLineSchema = z.object({
  line_code: z.string().describe("Unique identifier for the line comment"),
  type: z
    .string()
    .describe("Indicates whether it's a comment on an old or new line"),
  old_line: z
    .number()
    .optional()
    .describe("Line number in the old version of the file"),
  new_line: z
    .number()
    .optional()
    .describe("Line number in the new version of the file"),
});

const GitLabThreadLineRangeSchema = z
  .object({
    start: GitLabThreadLineSchema.describe("Start of the line range"),
    end: GitLabThreadLineSchema.describe("End of the line range"),
  })
  .describe("Represents a range of lines being commented on");

const GitLabThreadPositionSchema = z
  .object({
    base_sha: z.string().describe("SHA of the base commit of the diff."),
    start_sha: z
      .string()
      .describe("SHA of the starting commit in the diff comparison."),
    head_sha: z.string().describe("SHA of the head commit in the diff."),
    old_path: z.string().describe("Path to the file in the old version"),
    new_path: z.string().describe("Path to the file in the new version"),
    position_type: z
      .enum(["text", "image", "file"])
      .describe("Type of position, usually 'text'"),
    old_line: z
      .number()
      .describe("Line number in the old file. (Must not be null)")
      .optional(),
    new_line: z
      .number()
      .describe("Line number in the new file. (Must not be null)")
      .optional(),
    line_range: GitLabThreadLineRangeSchema.optional().nullable(),
    // width: z.number().optional().describe("Image width for image diff notes"),
    // height: z.number().optional().describe("Image height for image diff notes"),
    // x: z.number().optional().describe("X coordinate for image diff notes"),
    // y: z.number().optional().describe("Y coordinate for image diff notes"),
  })
  .describe("Describes the exact location of the note in the diff");

export const GitLabThreadNoteSchema = GitLabNoteSchema.extend({
  type: z
    .union([z.enum(["Note", "Discussion", "DiscussionNote"]), z.null()])
    .describe("Type of note, e.g., 'Discussion'"),
  attachment: z.any().nullable().describe("Any file attachment to the note"),
  commit_id: z
    .string()
    .optional()
    .describe("SHA of the commit this note is associated with"),
  position: GitLabThreadPositionSchema.optional(),
  resolved: z
    .boolean()
    .optional()
    .describe("True if the note has been resolved"),
  resolved_by: GitLabUserSchema.optional()
    .nullable()
    .describe("User who resolved the note (nullable)"),
}).describe("Represents a single comment or note on a diff");

export const GitLabThreadSchema = z.object({
  id: z.string(),
  individual_note: z.boolean(),
  notes: z.array(GitLabThreadNoteSchema),
});

export const GitLabThreadListSchema = z.array(GitLabThreadSchema);

const GitLabMergeRequestVersionSchema = z.object({
  id: z.number().describe("Merge request version id"),
  head_commit_sha: z.string().describe("Head commit SHA"),
  base_commit_sha: z.string().describe("Base commit SHA"),
  start_commit_sha: z.string().describe("Start commit SHA"),
  merge_request_id: z.number().describe("Merge request id"),
});

export const GitLabMergeRequestVersionListSchema = z
  .array(GitLabMergeRequestVersionSchema)
  .describe(
    "List of merge request version. The newest version is the first element of the list"
  );

// API Operation Parameter Schemas
const ProjectParamsSchema = z.object({
  project_id: z.string().describe("Project ID or URL-encoded path"), // Changed from owner/repo to match GitLab API
});

const MergeRequestParamsSchema = ProjectParamsSchema.extend({
  merge_request_iid: z
    .string()
    .describe("The internal ID of the merge request."),
});

const DiscussionParamsSchema = MergeRequestParamsSchema.extend({
  discussion_id: z.string().describe("The ID of a thread."),
});

export const CreateOrUpdateFileSchema = ProjectParamsSchema.extend({
  file_path: z.string().describe("Path where to create/update the file"),
  content: z.string().describe("Content of the file"),
  commit_message: z.string().describe("Commit message"),
  branch: z.string().describe("Branch to create/update the file in"),
  previous_path: z
    .string()
    .optional()
    .describe("Path of the file to move/rename"),
});

export const SearchRepositoriesSchema = z.object({
  search: z.string().describe("Search query"), // Changed from query to match GitLab API
  page: z
    .number()
    .optional()
    .describe("Page number for pagination (default: 1)"),
  per_page: z
    .number()
    .optional()
    .describe("Number of results per page (default: 20)"),
});

export const CreateRepositorySchema = z.object({
  name: z.string().describe("Repository name"),
  description: z.string().optional().describe("Repository description"),
  visibility: z
    .enum(["private", "internal", "public"])
    .optional()
    .describe("Repository visibility level"),
  initialize_with_readme: z
    .boolean()
    .optional()
    .describe("Initialize with README.md"),
});

export const GetFileContentsSchema = ProjectParamsSchema.extend({
  file_path: z.string().describe("Path to the file or directory"),
  ref: z.string().describe("Branch/tag/commit to get contents from"),
});

export const PushFilesSchema = ProjectParamsSchema.extend({
  branch: z.string().describe("Branch to push to"),
  files: z
    .array(
      z.object({
        file_path: z.string().describe("Path where to create the file"),
        content: z.string().describe("Content of the file"),
      })
    )
    .describe("Array of files to push"),
  commit_message: z.string().describe("Commit message"),
});

export const CreateIssueSchema = ProjectParamsSchema.extend({
  title: z.string().describe("Issue title"),
  description: z.string().optional().describe("Issue description"),
  assignee_ids: z
    .array(z.number())
    .optional()
    .describe("Array of user IDs to assign"),
  labels: z.array(z.string()).optional().describe("Array of label names"),
  milestone_id: z.number().optional().describe("Milestone ID to assign"),
});

export const CreateMergeRequestSchema = ProjectParamsSchema.extend({
  title: z.string().describe("Merge request title"),
  description: z.string().optional().describe("Merge request description"),
  source_branch: z.string().describe("Branch containing changes"),
  target_branch: z.string().describe("Branch to merge into"),
  draft: z.boolean().optional().describe("Create as draft merge request"),
  allow_collaboration: z
    .boolean()
    .optional()
    .describe("Allow commits from upstream members"),
});

export const ForkRepositorySchema = ProjectParamsSchema.extend({
  namespace: z.string().optional().describe("Namespace to fork to (full path)"),
});

export const CreateBranchSchema = ProjectParamsSchema.extend({
  branch: z.string().describe("Name for the new branch"),
  ref: z.string().optional().describe("Source branch/commit for new branch"),
});

export const CommentMergeRequestSchema = MergeRequestParamsSchema.extend({
  body: z.string().describe("Comment content"),
});

export const GetMergeRequestDiffsSchema = MergeRequestParamsSchema;

export const GetMergeRequestRawDiffsSchema = MergeRequestParamsSchema;

export const ApproveMergeRequestSchema = MergeRequestParamsSchema;

export const UnapproveMergeRequestSchema = MergeRequestParamsSchema;

export const GetMergeRequestVersionSchema = MergeRequestParamsSchema;

export const CreateMergeRequestThreadSchema = MergeRequestParamsSchema.extend({
  body: z.string().min(1).describe("The content of the thread"),
  commit_id: z
    .string()
    .optional()
    .describe("SHA referencing commit to start this thread on"),
  // created_at: z
  //   .string()
  //   .optional()
  //   .describe("ISO 8601 date-time string, requires admin/project owner rights"),
  position: z
    .object({
      base_sha: z
        .string()
        .describe(
          "SHA of the base commit of the diff. Get from merge request version"
        ),
      start_sha: z
        .string()
        .describe(
          "SHA of the starting commit in the diff comparison. Get from merge request version"
        ),
      head_sha: z
        .string()
        .describe(
          "SHA of the head commit in the diff. Get from merge request version"
        ),
      old_path: z.string().describe("Path to the file in the old version"),
      new_path: z.string().describe("Path to the file in the new version"),
      position_type: z
        .enum(["text", "image", "file"])
        .describe("Type of position, usually 'text'"),
      old_line: z
        .number()
        .describe(
          "Use this without 'new_line' to create a thread on an removed line (line start with -). Or use with new_line to create a thread on an unchanged line"
        )
        .optional(),
      new_line: z
        .number()
        .describe(
          "Use this without 'old_line' to create a thread on an added line (line start with +). Or use with old_line to create a thread on an unchanged line"
        )
        .optional(),
    })
    .optional()
    .describe("Optional position object for diff/image/file comments"),
});

export const ResolveMergeRequestThreadSchema = DiscussionParamsSchema.extend({
  resolved: z.boolean().describe("Resolve or unresolve the discussion."),
});

export const AddNoteToMergeRequestThreadSchema = DiscussionParamsSchema.extend({
  body: z.string().min(1).describe("The content of the thread"),
  note_id: z.string().optional().describe("The ID of a thread note."),
});

export const GetThreadListMergeRequestSchema = MergeRequestParamsSchema.extend({
  page: z
    .number()
    .optional()
    .describe("Page number for pagination (default: 1)"),
  per_page: z
    .number()
    .optional()
    .describe("Number of results per page (default: 20)"),
});

// Export types
export type GitLabAuthor = z.infer<typeof GitLabAuthorSchema>;
export type GitLabFork = z.infer<typeof GitLabForkSchema>;
export type GitLabIssue = z.infer<typeof GitLabIssueSchema>;
export type GitLabMergeRequest = z.infer<typeof GitLabMergeRequestSchema>;
export type GitLabRepository = z.infer<typeof GitLabRepositorySchema>;
export type GitLabFileContent = z.infer<typeof GitLabFileContentSchema>;
export type GitLabDirectoryContent = z.infer<
  typeof GitLabDirectoryContentSchema
>;
export type GitLabContent = z.infer<typeof GitLabContentSchema>;
export type FileOperation = z.infer<typeof FileOperationSchema>;
export type GitLabTree = z.infer<typeof GitLabTreeSchema>;
export type GitLabCommit = z.infer<typeof GitLabCommitSchema>;
export type GitLabReference = z.infer<typeof GitLabReferenceSchema>;
export type GitLabNote = z.infer<typeof GitLabNoteSchema>;
export type GitLabApproval = z.infer<typeof GitLabApprovalSchema>;
export type GitLabThreadPosition = z.infer<typeof GitLabThreadPositionSchema>;
export type GitLabThread = z.infer<typeof GitLabThreadSchema>;
export type GitLabThreadNote = z.infer<typeof GitLabThreadNoteSchema>;
export type GitLabMergeRequestVersion = z.infer<
  typeof GitLabMergeRequestVersionSchema
>;
export type CreateRepositoryOptions = z.infer<
  typeof CreateRepositoryOptionsSchema
>;
export type CreateIssueOptions = z.infer<typeof CreateIssueOptionsSchema>;
export type CreateMergeRequestOptions = z.infer<
  typeof CreateMergeRequestOptionsSchema
>;
export type CreateBranchOptions = z.infer<typeof CreateBranchOptionsSchema>;
export type GitLabCreateUpdateFileResponse = z.infer<
  typeof GitLabCreateUpdateFileResponseSchema
>;
export type GitLabSearchResponse = z.infer<typeof GitLabSearchResponseSchema>;
export type GitLabMergeRequestDiffs = z.infer<
  typeof GitLabMergeRequestDiffsSchema
>;
export type GitLabMergeRequestRawDiffs = z.infer<
  typeof GitLabMergeRequestRawDiffsSchema
>;
