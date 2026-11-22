package com.devcolab.repo_service.service;

import com.devcolab.repo_service.dto.*;
import com.devcolab.repo_service.exception.GitOperationException;
import com.devcolab.repo_service.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.dircache.DirCache;
import org.eclipse.jgit.dircache.DirCacheBuilder;
import org.eclipse.jgit.dircache.DirCacheEntry;
import org.eclipse.jgit.diff.DiffEntry;
import org.eclipse.jgit.diff.DiffFormatter;
import org.eclipse.jgit.lib.*;
import org.eclipse.jgit.merge.MergeStrategy;
import org.eclipse.jgit.merge.Merger;
import org.eclipse.jgit.merge.ResolveMerger;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevTree;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
public class GitService {

    @Value("${git.storage.base-path:./git-repositories}")
    private String basePath;

    public Path getRepoPath(Long projectId) {
        return Paths.get(basePath, "project-" + projectId + ".git");
    }

    public Repository getOrOpenRepository(Long projectId) {
        File repoDir = getRepoPath(projectId).toFile();
        if (!repoDir.exists()) {
            throw new ResourceNotFoundException("Repository not found for project " + projectId);
        }
        try {
            return new FileRepositoryBuilder().setGitDir(repoDir).build();
        } catch (IOException e) {
            throw new GitOperationException("Failed to open repository for project " + projectId, e);
        }
    }

    public boolean repositoryExists(Long projectId) {
        return getRepoPath(projectId).toFile().exists();
    }

    public void deleteRepository(Long projectId) {
        Path repoPath = getRepoPath(projectId);
        File repoDir = repoPath.toFile();
        if (repoDir.exists()) {
            try {
                org.springframework.util.FileSystemUtils.deleteRecursively(repoDir);
                log.info("Deleted Git repository for project {} at {}", projectId, repoPath);
            } catch (Exception e) {
                log.error("Failed to delete Git repository for project {}: {}", projectId, e.getMessage(), e);
            }
        }
    }

    /**
     * Initializes a bare Git repository with an initial commit on 'main'.
     */
    public void initRepository(Long projectId) {
        Path repoPath = getRepoPath(projectId);
        File repoDir = repoPath.toFile();

        if (repoDir.exists()) {
            log.info("Repository for project {} already exists at {}", projectId, repoPath);
            return;
        }

        try {
            Files.createDirectories(repoPath.getParent());
            Repository repo = FileRepositoryBuilder.create(repoDir);
            repo.create(true); // create bare repository

            try (ObjectInserter inserter = repo.newObjectInserter()) {
                // 1. Create default README.md blob
                String readmeContent = "# Project " + projectId + "\n\n"
                        + "Welcome to the DevColab project repository.\n"
                        + "Create branches, edit files, and submit Pull Requests to collaborate.";
                ObjectId blobId = inserter.insert(Constants.OBJ_BLOB, readmeContent.getBytes(StandardCharsets.UTF_8));

                // 2. Build Tree
                DirCache index = DirCache.newInCore();
                DirCacheBuilder builder = index.builder();
                DirCacheEntry entry = new DirCacheEntry("README.md");
                entry.setFileMode(FileMode.REGULAR_FILE);
                entry.setObjectId(blobId);
                builder.add(entry);
                builder.finish();
                ObjectId treeId = index.writeTree(inserter);

                // 3. Create initial commit
                PersonIdent systemIdent = new PersonIdent("DevColab System", "system@devcolab.local");
                CommitBuilder commit = new CommitBuilder();
                commit.setTreeId(treeId);
                commit.setAuthor(systemIdent);
                commit.setCommitter(systemIdent);
                commit.setMessage("Initial repository commit");
                ObjectId commitId = inserter.insert(commit);
                inserter.flush();

                // 4. Update 'main' branch ref
                RefUpdate ru = repo.updateRef(Constants.R_HEADS + "main");
                ru.setNewObjectId(commitId);
                ru.update();

                // 5. Point HEAD to main
                RefUpdate headRu = repo.updateRef(Constants.HEAD);
                headRu.link(Constants.R_HEADS + "main");
            }
            log.info("Initialized bare Git repository for project {} at {}", projectId, repoPath);
        } catch (IOException e) {
            throw new GitOperationException("Failed to initialize repository for project " + projectId, e);
        }
    }

    /**
     * Lists all local branches.
     */
    public List<BranchDto> listBranches(Long projectId) {
        try (Repository repo = getOrOpenRepository(projectId);
             Git git = new Git(repo);
             RevWalk walk = new RevWalk(repo)) {

            List<Ref> refs = git.branchList().call();
            List<BranchDto> result = new ArrayList<>();

            for (Ref ref : refs) {
                String branchName = Repository.shortenRefName(ref.getName());
                RevCommit commit = walk.parseCommit(ref.getObjectId());

                String commitDate = DateTimeFormatter.ISO_INSTANT.format(
                        Instant.ofEpochSecond(commit.getCommitTime()).atZone(ZoneId.systemDefault())
                );

                result.add(BranchDto.builder()
                        .name(branchName)
                        .isDefault("main".equalsIgnoreCase(branchName))
                        .latestCommitHash(commit.getId().name())
                        .latestCommitMessage(commit.getShortMessage())
                        .authorName(commit.getAuthorIdent().getName())
                        .commitDate(commitDate)
                        .build());
            }

            return result;
        } catch (Exception e) {
            throw new GitOperationException("Failed to list branches for project " + projectId, e);
        }
    }

    /**
     * Creates a new branch from a base branch (defaulting to 'main').
     */
    public void createBranch(Long projectId, String branchName, String baseBranch) {
        String base = (baseBranch == null || baseBranch.isBlank()) ? "main" : baseBranch.trim();
        String targetBranch = branchName.trim();

        try (Repository repo = getOrOpenRepository(projectId);
             Git git = new Git(repo)) {

            Ref existing = repo.findRef(Constants.R_HEADS + targetBranch);
            if (existing != null) {
                throw new GitOperationException("Branch '" + targetBranch + "' already exists.");
            }

            Ref baseRef = repo.findRef(Constants.R_HEADS + base);
            if (baseRef == null) {
                throw new ResourceNotFoundException("Base branch '" + base + "' not found.");
            }

            git.branchCreate()
                    .setName(targetBranch)
                    .setStartPoint(baseRef.getName())
                    .call();

            log.info("Created branch '{}' from '{}' in project {}", targetBranch, base, projectId);
        } catch (GitOperationException | ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new GitOperationException("Failed to create branch '" + targetBranch + "': " + e.getMessage(), e);
        }
    }

    /**
     * Gets file/directory tree for a branch.
     */
    public List<FileNodeDto> getTree(Long projectId, String branch, String subPath) {
        String targetBranch = (branch == null || branch.isBlank()) ? "main" : branch.trim();

        try (Repository repo = getOrOpenRepository(projectId);
             RevWalk revWalk = new RevWalk(repo)) {

            Ref branchRef = repo.findRef(Constants.R_HEADS + targetBranch);
            if (branchRef == null) {
                throw new ResourceNotFoundException("Branch '" + targetBranch + "' not found.");
            }

            RevCommit commit = revWalk.parseCommit(branchRef.getObjectId());
            RevTree tree = commit.getTree();

            List<FileNodeDto> nodes = new ArrayList<>();
            try (TreeWalk treeWalk = new TreeWalk(repo)) {
                treeWalk.addTree(tree);
                treeWalk.setRecursive(true);

                while (treeWalk.next()) {
                    String path = treeWalk.getPathString();
                    if (subPath != null && !subPath.isBlank() && !path.startsWith(subPath)) {
                        continue;
                    }

                    FileMode mode = treeWalk.getFileMode(0);
                    long size = 0;
                    try {
                        size = repo.open(treeWalk.getObjectId(0)).getSize();
                    } catch (Exception ignored) {}

                    nodes.add(FileNodeDto.builder()
                            .name(treeWalk.getNameString())
                            .path(path)
                            .type(mode.equals(FileMode.TREE) ? "DIRECTORY" : "FILE")
                            .size(size)
                            .build());
                }
            }
            return nodes;
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new GitOperationException("Failed to fetch tree for project " + projectId, e);
        }
    }

    /**
     * Reads file blob content as String for Monaco Editor.
     */
    public FileContentDto getFileContent(Long projectId, String branch, String filePath) {
        String targetBranch = (branch == null || branch.isBlank()) ? "main" : branch.trim();

        try (Repository repo = getOrOpenRepository(projectId);
             RevWalk revWalk = new RevWalk(repo)) {

            Ref branchRef = repo.findRef(Constants.R_HEADS + targetBranch);
            if (branchRef == null) {
                throw new ResourceNotFoundException("Branch '" + targetBranch + "' not found.");
            }

            RevCommit commit = revWalk.parseCommit(branchRef.getObjectId());
            RevTree tree = commit.getTree();

            try (TreeWalk treeWalk = TreeWalk.forPath(repo, filePath, tree)) {
                if (treeWalk == null) {
                    throw new ResourceNotFoundException("File '" + filePath + "' not found on branch '" + targetBranch + "'");
                }

                ObjectId blobId = treeWalk.getObjectId(0);
                ObjectLoader loader = repo.open(blobId);
                byte[] bytes = loader.getBytes();

                return FileContentDto.builder()
                        .path(filePath)
                        .branch(targetBranch)
                        .content(new String(bytes, StandardCharsets.UTF_8))
                        .size(loader.getSize())
                        .build();
            }
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new GitOperationException("Failed to read file '" + filePath + "': " + e.getMessage(), e);
        }
    }

    /**
     * Commits/updates a file directly in the bare repository using ObjectInserter & DirCache.
     */
    public void commitFile(Long projectId, Long userId, CommitFileRequest req) {
        String branch = req.getBranch().trim();

        try (Repository repo = getOrOpenRepository(projectId);
             RevWalk revWalk = new RevWalk(repo);
             ObjectInserter inserter = repo.newObjectInserter()) {

            Ref branchRef = repo.findRef(Constants.R_HEADS + branch);
            if (branchRef == null) {
                throw new ResourceNotFoundException("Branch '" + branch + "' not found.");
            }

            RevCommit parentCommit = revWalk.parseCommit(branchRef.getObjectId());

            // 1. Insert file blob
            byte[] contentBytes = req.getContent() != null ? req.getContent().getBytes(StandardCharsets.UTF_8) : new byte[0];
            ObjectId blobId = inserter.insert(Constants.OBJ_BLOB, contentBytes);

            // 2. Build in-memory index from parent commit tree
            DirCache index = DirCache.newInCore();
            DirCacheBuilder builder = index.builder();

            try (TreeWalk treeWalk = new TreeWalk(repo)) {
                treeWalk.addTree(parentCommit.getTree());
                treeWalk.setRecursive(true);

                while (treeWalk.next()) {
                    String path = treeWalk.getPathString();
                    if (!path.equals(req.getPath())) {
                        DirCacheEntry entry = new DirCacheEntry(path);
                        entry.setFileMode(treeWalk.getFileMode(0));
                        entry.setObjectId(treeWalk.getObjectId(0));
                        builder.add(entry);
                    }
                }
            }

            // Add the modified/new file entry
            DirCacheEntry newEntry = new DirCacheEntry(req.getPath());
            newEntry.setFileMode(FileMode.REGULAR_FILE);
            newEntry.setObjectId(blobId);
            builder.add(newEntry);
            builder.finish();

            // 3. Write tree
            ObjectId newTreeId = index.writeTree(inserter);

            // 4. Create commit
            String authorName = (req.getAuthorName() != null && !req.getAuthorName().isBlank())
                    ? req.getAuthorName() : "User " + userId;
            String authorEmail = (req.getAuthorEmail() != null && !req.getAuthorEmail().isBlank())
                    ? req.getAuthorEmail() : "user" + userId + "@devcolab.local";

            PersonIdent author = new PersonIdent(authorName, authorEmail);
            CommitBuilder cb = new CommitBuilder();
            cb.setTreeId(newTreeId);
            cb.setParentId(parentCommit.getId());
            cb.setAuthor(author);
            cb.setCommitter(author);
            cb.setMessage(req.getCommitMessage());
            ObjectId newCommitId = inserter.insert(cb);
            inserter.flush();

            // 5. Advance branch ref
            RefUpdate ru = repo.updateRef(Constants.R_HEADS + branch);
            ru.setNewObjectId(newCommitId);
            ru.setExpectedOldObjectId(parentCommit.getId());
            RefUpdate.Result result = ru.update();

            if (result != RefUpdate.Result.FAST_FORWARD && result != RefUpdate.Result.FORCED && result != RefUpdate.Result.NEW) {
                throw new GitOperationException("Branch update failed: " + result);
            }

            log.info("Committed file '{}' to branch '{}' in project {} by user {}", req.getPath(), branch, projectId, userId);
        } catch (ResourceNotFoundException | GitOperationException e) {
            throw e;
        } catch (Exception e) {
            throw new GitOperationException("Failed to commit file: " + e.getMessage(), e);
        }
    }

    /**
     * Calculates diff and mergeability between source and target branches.
     */
    public DiffResultDto getDiff(Long projectId, String sourceBranch, String targetBranch) {
        String source = sourceBranch.trim();
        String target = (targetBranch == null || targetBranch.isBlank()) ? "main" : targetBranch.trim();

        try (Repository repo = getOrOpenRepository(projectId);
             RevWalk revWalk = new RevWalk(repo);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Ref sourceRef = repo.findRef(Constants.R_HEADS + source);
            Ref targetRef = repo.findRef(Constants.R_HEADS + target);

            if (sourceRef == null) throw new ResourceNotFoundException("Source branch '" + source + "' not found.");
            if (targetRef == null) throw new ResourceNotFoundException("Target branch '" + target + "' not found.");

            RevCommit sourceCommit = revWalk.parseCommit(sourceRef.getObjectId());
            RevCommit targetCommit = revWalk.parseCommit(targetRef.getObjectId());

            // Format unified diff
            List<String> changedFiles = new ArrayList<>();
            try (DiffFormatter df = new DiffFormatter(out)) {
                df.setRepository(repo);
                List<DiffEntry> diffs = df.scan(targetCommit.getTree(), sourceCommit.getTree());
                for (DiffEntry diff : diffs) {
                    df.format(diff);
                    changedFiles.add(diff.getNewPath() != null ? diff.getNewPath() : diff.getOldPath());
                }
            }

            // Check mergeability and conflicts
            Merger merger = MergeStrategy.RECURSIVE.newMerger(repo, true);
            boolean canMerge = merger.merge(targetCommit, sourceCommit);
            List<String> conflictingFiles = new ArrayList<>();

            if (!canMerge && merger instanceof ResolveMerger rm) {
                conflictingFiles.addAll(rm.getUnmergedPaths());
            }

            return DiffResultDto.builder()
                    .sourceBranch(source)
                    .targetBranch(target)
                    .rawDiff(out.toString(StandardCharsets.UTF_8))
                    .changedFiles(changedFiles)
                    .hasConflicts(!canMerge)
                    .conflictingFiles(conflictingFiles)
                    .build();
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new GitOperationException("Failed to compute diff: " + e.getMessage(), e);
        }
    }

    /**
     * Performs a 3-way recursive merge of sourceBranch into targetBranch.
     */
    public void mergeBranches(Long projectId, String sourceBranch, String targetBranch, String commitMessage, Long userId, String authorName, String authorEmail) {
        String source = sourceBranch.trim();
        String target = (targetBranch == null || targetBranch.isBlank()) ? "main" : targetBranch.trim();

        try (Repository repo = getOrOpenRepository(projectId);
             RevWalk revWalk = new RevWalk(repo);
             ObjectInserter inserter = repo.newObjectInserter()) {

            Ref sourceRef = repo.findRef(Constants.R_HEADS + source);
            Ref targetRef = repo.findRef(Constants.R_HEADS + target);

            if (sourceRef == null) throw new ResourceNotFoundException("Source branch '" + source + "' not found.");
            if (targetRef == null) throw new ResourceNotFoundException("Target branch '" + target + "' not found.");

            RevCommit sourceCommit = revWalk.parseCommit(sourceRef.getObjectId());
            RevCommit targetCommit = revWalk.parseCommit(targetRef.getObjectId());

            // 3-way recursive merger
            Merger merger = MergeStrategy.RECURSIVE.newMerger(repo, true);
            boolean canMerge = merger.merge(targetCommit, sourceCommit);

            if (!canMerge) {
                List<String> conflicts = new ArrayList<>();
                if (merger instanceof ResolveMerger rm) {
                    conflicts.addAll(rm.getUnmergedPaths());
                }
                throw new GitOperationException("Cannot merge due to conflicts in: " + conflicts);
            }

            ObjectId resultTreeId = merger.getResultTreeId();

            // Create merge commit with 2 parents
            PersonIdent committer = new PersonIdent(
                    authorName != null ? authorName : "DevColab User " + userId,
                    authorEmail != null ? authorEmail : "user" + userId + "@devcolab.local"
            );

            CommitBuilder cb = new CommitBuilder();
            cb.setTreeId(resultTreeId);
            cb.setParentIds(targetCommit.getId(), sourceCommit.getId());
            cb.setAuthor(committer);
            cb.setCommitter(committer);
            cb.setMessage(commitMessage != null && !commitMessage.isBlank()
                    ? commitMessage
                    : "Merge branch '" + source + "' into '" + target + "'");

            ObjectId mergeCommitId = inserter.insert(cb);
            inserter.flush();

            // Advance target branch ref
            RefUpdate ru = repo.updateRef(Constants.R_HEADS + target);
            ru.setNewObjectId(mergeCommitId);
            ru.setExpectedOldObjectId(targetCommit.getId());
            RefUpdate.Result result = ru.update();

            if (result != RefUpdate.Result.FAST_FORWARD && result != RefUpdate.Result.FORCED && result != RefUpdate.Result.NEW) {
                throw new GitOperationException("Failed to update target branch after merge: " + result);
            }

            log.info("Successfully merged branch '{}' into '{}' for project {}", source, target, projectId);
        } catch (ResourceNotFoundException | GitOperationException e) {
            throw e;
        } catch (Exception e) {
            throw new GitOperationException("Failed to merge branch: " + e.getMessage(), e);
        }
    }
}
