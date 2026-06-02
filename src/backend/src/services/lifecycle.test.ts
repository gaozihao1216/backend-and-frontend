import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { UserSchema } from "../system/object/store-contracts.js";
import { comments, favorites, levels, ratings, resetStore, submissions, users } from "../system/object/store.js";
import { commentService } from "./comment-service.js";
import { favoriteService } from "./favorite-service.js";
import { levelService } from "./level-service.js";
import { ratingService } from "./rating-service.js";
import { submissionService } from "./submission-service.js";
import { userService } from "./user-service.js";

process.env.NODE_ENV = "test";

beforeEach(() => {
  resetStore();
});

test("level lifecycle reaches published and becomes visible to players", () => {
  const initialLevelCount = levels.length;
  const initialSubmissionCount = submissions.length;

  const level = levelService.createLevel("designer-1", {
    title: "Lifecycle Test Level",
    description: "Lifecycle test",
    tags: ["strategy"],
    data: {
      world: {
        width: 1200,
        height: 800,
        gravity: 9.8,
      },
      birdInventory: {
        basic: 3,
      },
      obstacles: [],
      enemies: [
        {
          id: "enemy-lifecycle-test",
          type: "pig",
          position: {
            x: 900,
            y: 120,
          },
        },
      ],
    },
  });

  assert.equal(level.status, "draft");

  const submission = submissionService.submitLevel(level.id, "designer-1");
  const pendingLevel = levelService.getLevelById(level.id);

  assert.equal(submission.status, "pending_review");
  assert.equal(pendingLevel.status, "pending_review");

  submissionService.reviewSubmission(submission.id, "admin-1", {
    status: "approved",
  });

  const publishedLevel = levelService.getLevelById(level.id);
  const publishedLevels = levelService.getPublishedLevels();
  const strategyLevels = levelService.getPublishedLevels({ tag: "strategy" });

  assert.equal(publishedLevel.status, "published");
  assert.ok(publishedLevels.some((candidate) => candidate.id === level.id));
  assert.ok(strategyLevels.some((candidate) => candidate.id === level.id));

  levels.splice(initialLevelCount);
  submissions.splice(initialSubmissionCount);
});

test("published level accepts comments and admin can moderate them", () => {
  const initialLevelCount = levels.length;
  const initialSubmissionCount = submissions.length;
  const initialCommentCount = comments.length;

  const level = levelService.createLevel("designer-1", {
    title: "Comment Flow Level",
    description: "Comment flow test",
    tags: ["hard"],
    data: {
      world: {
        width: 1400,
        height: 900,
        gravity: 9.8,
      },
      birdInventory: {
        basic: 4,
      },
      obstacles: [],
      enemies: [
        {
          id: "enemy-comment-test",
          type: "pig",
          position: {
            x: 820,
            y: 160,
          },
        },
      ],
    },
  });

  const submission = submissionService.submitLevel(level.id, "designer-1");
  submissionService.reviewSubmission(submission.id, "admin-1", {
    status: "approved",
  });

  const created = commentService.createComment("player-1", level.id, {
    content: "这关的连锁反馈不错，但第二段支点有点难观察。",
  });

  const levelComments = commentService.getCommentsForPublishedLevel(level.id);
  assert.equal(levelComments.length, 1);
  assert.equal(levelComments[0]?.id, created.id);

  const deleted = commentService.deleteComment(created.id);
  assert.equal(deleted.id, created.id);
  assert.equal(commentService.getCommentsForPublishedLevel(level.id).length, 0);

  comments.splice(initialCommentCount);
  levels.splice(initialLevelCount);
  submissions.splice(initialSubmissionCount);
});

test("published level can be favorited and removed by player", () => {
  const initialLevelCount = levels.length;
  const initialSubmissionCount = submissions.length;
  const initialFavoriteCount = favorites.length;

  const level = levelService.createLevel("designer-1", {
    title: "Favorite Flow Level",
    description: "Favorite flow test",
    tags: ["funny"],
    data: {
      world: {
        width: 1280,
        height: 720,
        gravity: 9.8,
      },
      birdInventory: {
        basic: 2,
      },
      obstacles: [],
      enemies: [
        {
          id: "enemy-favorite-test",
          type: "pig",
          position: {
            x: 850,
            y: 180,
          },
        },
      ],
    },
  });

  const submission = submissionService.submitLevel(level.id, "designer-1");
  submissionService.reviewSubmission(submission.id, "admin-1", {
    status: "approved",
  });

  const favorite = favoriteService.addFavorite("player-1", level.id);
  const playerFavorites = favoriteService.getFavoritesForUser("player-1");

  assert.equal(playerFavorites.length, 1);
  assert.equal(playerFavorites[0]?.id, favorite.id);

  const removed = favoriteService.removeFavorite("player-1", level.id);
  assert.equal(removed.id, favorite.id);
  assert.equal(favoriteService.getFavoritesForUser("player-1").length, 0);

  favorites.splice(initialFavoriteCount);
  levels.splice(initialLevelCount);
  submissions.splice(initialSubmissionCount);
});

test("published levels can be sorted by newest, rating average, and rating count", () => {
  const initialLevelCount = levels.length;
  const initialSubmissionCount = submissions.length;
  const initialRatingCount = ratings.length;

  const firstLevel = levelService.createLevel("designer-1", {
    title: "Sorting First Level",
    description: "Sorting test first",
    tags: ["strategy"],
    data: {
      world: {
        width: 1200,
        height: 800,
        gravity: 9.8,
      },
      birdInventory: {
        basic: 3,
      },
      obstacles: [],
      enemies: [
        {
          id: "enemy-sorting-first",
          type: "pig",
          position: {
            x: 900,
            y: 120,
          },
        },
      ],
    },
  });

  const secondLevel = levelService.createLevel("designer-1", {
    title: "Sorting Second Level",
    description: "Sorting test second",
    tags: ["strategy"],
    data: {
      world: {
        width: 1400,
        height: 900,
        gravity: 9.8,
      },
      birdInventory: {
        basic: 4,
      },
      obstacles: [],
      enemies: [
        {
          id: "enemy-sorting-second",
          type: "pig",
          position: {
            x: 880,
            y: 150,
          },
        },
      ],
    },
  });

  const firstSubmission = submissionService.submitLevel(firstLevel.id, "designer-1");
  const secondSubmission = submissionService.submitLevel(secondLevel.id, "designer-1");

  submissionService.reviewSubmission(firstSubmission.id, "admin-1", {
    status: "approved",
  });
  submissionService.reviewSubmission(secondSubmission.id, "admin-1", {
    status: "approved",
  });

  firstLevel.createdAt = "2026-01-01T00:00:00.000Z";
  secondLevel.createdAt = "2026-01-02T00:00:00.000Z";

  ratingService.rateLevel(firstLevel.id, "player-1", { score: 4 });
  ratingService.rateLevel(secondLevel.id, "player-1", { score: 5 });
  ratingService.rateLevel(secondLevel.id, "player-2", { score: 5 });

  const newest = levelService.getPublishedLevels({ tag: "strategy", sort: "newest" });
  const highestRated = levelService.getPublishedLevels({ tag: "strategy", sort: "highestRated" });
  const mostRated = levelService.getPublishedLevels({ tag: "strategy", sort: "mostRated" });

  assert.equal(newest[0]?.id, secondLevel.id);
  assert.equal(highestRated[0]?.id, secondLevel.id);
  assert.equal(mostRated[0]?.id, secondLevel.id);

  ratings.splice(initialRatingCount);
  levels.splice(initialLevelCount);
  submissions.splice(initialSubmissionCount);
});

test("user profile aggregates published levels, recent comments, and activity stats", () => {
  const initialLevelCount = levels.length;
  const initialSubmissionCount = submissions.length;
  const initialCommentCount = comments.length;
  const initialFavoriteCount = favorites.length;
  const initialRatingCount = ratings.length;

  const level = levelService.createLevel("designer-1", {
    title: "Profile Showcase Level",
    description: "Profile aggregation test",
    tags: ["funny"],
    data: {
      world: {
        width: 1280,
        height: 720,
        gravity: 9.8,
      },
      birdInventory: {
        basic: 3,
      },
      obstacles: [],
      enemies: [
        {
          id: "enemy-profile-test",
          type: "pig",
          position: {
            x: 860,
            y: 140,
          },
        },
      ],
    },
  });

  const submission = submissionService.submitLevel(level.id, "designer-1");
  submissionService.reviewSubmission(submission.id, "admin-1", {
    status: "approved",
  });

  commentService.createComment("designer-1", level.id, {
    content: "设计师自评：适合做首发展示。",
  });
  favoriteService.addFavorite("designer-1", level.id);
  ratingService.rateLevel(level.id, "designer-1", { score: 5 });

  const profile = userService.getProfile("designer-1");

  assert.equal(profile.user.id, "designer-1");
  assert.ok(profile.publishedLevels.some((candidate) => candidate.id === level.id));
  assert.ok(profile.recentComments.some((candidate) => candidate.levelId === level.id));
  assert.equal(profile.stats.favoriteCount, 1);
  assert.equal(profile.stats.ratingCount, 1);

  ratings.splice(initialRatingCount);
  favorites.splice(initialFavoriteCount);
  comments.splice(initialCommentCount);
  levels.splice(initialLevelCount);
  submissions.splice(initialSubmissionCount);
});

test("local frontend user can bind to a stable backend account", () => {
  const initialUserCount = users.length;

  const firstBind = userService.bindLocalUser({
    localUserId: "1234567890",
    nickname: "LocalPlayer",
    role: "player",
  });
  const secondBind = userService.bindLocalUser({
    localUserId: "1234567890",
    nickname: "LocalPlayer",
    role: "player",
  });

  assert.equal(firstBind.id, secondBind.id);
  assert.match(firstBind.username, /^local-player-[0-9a-z]{7}$/);
  assert.ok(firstBind.username.length <= 32);
  UserSchema.parse(firstBind);

  users.splice(initialUserCount);
});

test("binding user with long local user id still returns a valid user", () => {
  const initialUserCount = users.length;

  const boundUser = userService.bindLocalUser({
    localUserId: "frontend-user-id-abcdefghijklmnopqrstuvwxyz-1234567890-EXTRA",
    nickname: "LongLocalUser",
    role: "designer",
  });

  assert.ok(boundUser.username.length <= 32);
  UserSchema.parse(boundUser);

  users.splice(initialUserCount);
});
