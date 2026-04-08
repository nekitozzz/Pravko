import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import {
  buildTestApp,
  seedTestData,
  createShareLink,
  createGrant,
  cleanupTestData,
  TestSeed,
} from "./helpers.js";

let app: FastifyInstance;
let seed: TestSeed;
let shareToken: string;
let grantToken: string;

beforeAll(async () => {
  app = await buildTestApp();
  seed = await seedTestData();

  const link = await createShareLink(seed.video.id, seed.user.id);
  shareToken = link.token;
  grantToken = await createGrant(link.id);
});

afterAll(async () => {
  await cleanupTestData();
  await app.close();
});

describe("POST /api/share/:shareToken/comments — guest commenting", () => {
  it("creates a guest comment with valid grant and guest name", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/share/${shareToken}/comments`,
      payload: {
        grantToken,
        text: "Great video!",
        timestampSeconds: 10.5,
        guestName: "Alice",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.text).toBe("Great video!");
    expect(body.userName).toBe("Alice");
    expect(body.userId).toBeNull();
    expect(body.timestampSeconds).toBe(10.5);
  });

  it("rejects when grantToken is missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/share/${shareToken}/comments`,
      payload: {
        text: "No grant",
        timestampSeconds: 0,
        guestName: "Bob",
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it("rejects when grantToken is invalid", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/share/${shareToken}/comments`,
      payload: {
        grantToken: "invalid_token_that_does_not_exist",
        text: "Bad grant",
        timestampSeconds: 0,
        guestName: "Charlie",
      },
    });

    expect(res.statusCode).toBe(403);
  });

  it("rejects when guestName is missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/share/${shareToken}/comments`,
      payload: {
        grantToken,
        text: "Missing name",
        timestampSeconds: 0,
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("rejects when guestName is empty", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/share/${shareToken}/comments`,
      payload: {
        grantToken,
        text: "Empty name",
        timestampSeconds: 0,
        guestName: "   ",
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("rejects when guestName exceeds 100 chars", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/share/${shareToken}/comments`,
      payload: {
        grantToken,
        text: "Long name",
        timestampSeconds: 0,
        guestName: "A".repeat(101),
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("guest comment appears in GET share comments", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/share/${grantToken}/comments`,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    // Should find the comment from the first test
    const guestComment = body.find(
      (c: any) => c.text === "Great video!" && c.replies !== undefined
    );
    expect(guestComment).toBeDefined();
    expect(guestComment.userName).toBe("Alice");
  });

  it("validates parentId belongs to the same video", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/share/${shareToken}/comments`,
      payload: {
        grantToken,
        text: "Invalid parent",
        timestampSeconds: 0,
        guestName: "Dave",
        parentId: "00000000-0000-0000-0000-000000000000",
      },
    });

    expect(res.statusCode).toBe(400);
  });
});
