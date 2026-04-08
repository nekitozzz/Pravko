import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import {
  buildTestApp,
  seedTestData,
  makeAuthToken,
  cleanupTestData,
  TestSeed,
} from "./helpers.js";

let app: FastifyInstance;
let seed: TestSeed;

beforeAll(async () => {
  app = await buildTestApp();
  seed = await seedTestData();
});

afterAll(async () => {
  await cleanupTestData();
  await app.close();
});

describe("Full share flows", () => {
  it("open link → get grant → post guest comment → read comments", async () => {
    const authToken = makeAuthToken({ sub: seed.user.id, email: seed.user.email, name: seed.user.name });

    // 1. Create open share link
    const createRes = await app.inject({
      method: "POST",
      url: `/api/videos/${seed.video.id}/share-links`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: {},
    });
    expect(createRes.statusCode).toBe(200);
    const shareToken = createRes.json().token;

    // 2. Check status
    const statusRes = await app.inject({
      method: "GET",
      url: `/api/share/${shareToken}`,
    });
    expect(statusRes.json().status).toBe("ok");

    // 3. Get access grant (no password needed)
    const grantRes = await app.inject({
      method: "POST",
      url: `/api/share/${shareToken}/access`,
    });
    expect(grantRes.json().ok).toBe(true);
    const grantToken = grantRes.json().grantToken;

    // 4. Post guest comment
    const commentRes = await app.inject({
      method: "POST",
      url: `/api/share/${shareToken}/comments`,
      payload: {
        grantToken,
        text: "Flow test comment",
        timestampSeconds: 5.0,
        guestName: "FlowTester",
      },
    });
    expect(commentRes.statusCode).toBe(200);
    expect(commentRes.json().text).toBe("Flow test comment");

    // 5. Read comments via grant
    const commentsRes = await app.inject({
      method: "GET",
      url: `/api/share/${grantToken}/comments`,
    });
    expect(commentsRes.statusCode).toBe(200);
    const threads = commentsRes.json();
    const found = threads.find(
      (t: any) => t.text === "Flow test comment"
    );
    expect(found).toBeDefined();
    expect(found.userName).toBe("FlowTester");
  });

  it("password link → get grant with password → post guest comment", async () => {
    const authToken = makeAuthToken({ sub: seed.user.id, email: seed.user.email, name: seed.user.name });

    // 1. Create password-protected link
    const createRes = await app.inject({
      method: "POST",
      url: `/api/videos/${seed.video.id}/share-links`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: { password: "mysecret" },
    });
    const shareToken = createRes.json().token;

    // 2. Status should be requiresPassword
    const statusRes = await app.inject({
      method: "GET",
      url: `/api/share/${shareToken}`,
    });
    expect(statusRes.json().status).toBe("requiresPassword");

    // 3. Wrong password fails
    const badGrantRes = await app.inject({
      method: "POST",
      url: `/api/share/${shareToken}/access`,
      payload: { password: "wrong" },
    });
    expect(badGrantRes.json().ok).toBe(false);

    // 4. Right password succeeds
    const grantRes = await app.inject({
      method: "POST",
      url: `/api/share/${shareToken}/access`,
      payload: { password: "mysecret" },
    });
    expect(grantRes.json().ok).toBe(true);
    const grantToken = grantRes.json().grantToken;

    // 5. Post guest comment
    const commentRes = await app.inject({
      method: "POST",
      url: `/api/share/${shareToken}/comments`,
      payload: {
        grantToken,
        text: "Password flow comment",
        timestampSeconds: 2.0,
        guestName: "PwTester",
      },
    });
    expect(commentRes.statusCode).toBe(200);
    expect(commentRes.json().text).toBe("Password flow comment");
  });

  it("email-restricted link → sign in → get grant → post comment", async () => {
    const authToken = makeAuthToken({ sub: seed.user.id, email: seed.user.email, name: seed.user.name });

    // 1. Create email-restricted link
    const createRes = await app.inject({
      method: "POST",
      url: `/api/videos/${seed.video.id}/share-links`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: { email: "viewer@test.com" },
    });
    const shareToken = createRes.json().token;

    // 2. Status should be requiresEmail
    const statusRes = await app.inject({
      method: "GET",
      url: `/api/share/${shareToken}`,
    });
    expect(statusRes.json().status).toBe("requiresEmail");

    // 3. Get grant with matching email
    app.setTestJwt({ sub: "viewer-id", email: "viewer@test.com" });
    const grantRes = await app.inject({
      method: "POST",
      url: `/api/share/${shareToken}/access`,
      headers: { authorization: "Bearer test-jwt" },
    });
    expect(grantRes.json().ok).toBe(true);
    const grantToken = grantRes.json().grantToken;

    // 4. Post comment
    const commentRes = await app.inject({
      method: "POST",
      url: `/api/share/${shareToken}/comments`,
      payload: {
        grantToken,
        text: "Email flow comment",
        timestampSeconds: 1.0,
        guestName: "EmailViewer",
      },
    });
    expect(commentRes.statusCode).toBe(200);
    expect(commentRes.json().text).toBe("Email flow comment");
  });
});
