import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import {
  buildTestApp,
  seedTestData,
  createShareLink,
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

describe("Email-restricted share links", () => {
  let emailLinkToken: string;

  it("creates a share link with email restriction", async () => {
    const authToken = makeAuthToken({ sub: seed.user.id, email: seed.user.email, name: seed.user.name });

    const res = await app.inject({
      method: "POST",
      url: `/api/videos/${seed.video.id}/share-links`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        email: "allowed@example.com",
      },
    });

    expect(res.statusCode).toBe(200);
    emailLinkToken = res.json().token;
    expect(emailLinkToken).toBeTruthy();
  });

  it("status endpoint returns requiresEmail for email-restricted link", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/share/${emailLinkToken}`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("requiresEmail");
  });

  it("access grant with matching email succeeds", async () => {
    // Configure test JWT to return matching email
    app.setTestJwt({ sub: "some-user", email: "allowed@example.com" });

    const res = await app.inject({
      method: "POST",
      url: `/api/share/${emailLinkToken}/access`,
      headers: { authorization: "Bearer test-jwt" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.grantToken).toBeTruthy();
  });

  it("access grant with wrong email fails", async () => {
    app.setTestJwt({ sub: "wrong-user", email: "wrong@example.com" });

    const res = await app.inject({
      method: "POST",
      url: `/api/share/${emailLinkToken}/access`,
      headers: { authorization: "Bearer test-jwt" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("email_mismatch");
  });

  it("access grant without auth on email-restricted link fails", async () => {
    app.setTestJwt(null); // No valid JWT

    const res = await app.inject({
      method: "POST",
      url: `/api/share/${emailLinkToken}/access`,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("email_auth_required");
  });

  it("email-restricted + password: both must pass", async () => {
    const authToken = makeAuthToken({ sub: seed.user.id, email: seed.user.email, name: seed.user.name });

    // Create link with both email and password
    const createRes = await app.inject({
      method: "POST",
      url: `/api/videos/${seed.video.id}/share-links`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        email: "dual@example.com",
        password: "secret123",
      },
    });
    const dualToken = createRes.json().token;

    // Status should be requiresEmail (checked first)
    const statusRes = await app.inject({
      method: "GET",
      url: `/api/share/${dualToken}`,
    });
    expect(statusRes.json().status).toBe("requiresEmail");

    // Right email, wrong password
    app.setTestJwt({ sub: "dual-user", email: "dual@example.com" });
    const wrongPwRes = await app.inject({
      method: "POST",
      url: `/api/share/${dualToken}/access`,
      headers: { authorization: "Bearer test-jwt" },
      payload: { password: "wrong" },
    });
    expect(wrongPwRes.json().ok).toBe(false);

    // Right email, right password
    const okRes = await app.inject({
      method: "POST",
      url: `/api/share/${dualToken}/access`,
      headers: { authorization: "Bearer test-jwt" },
      payload: { password: "secret123" },
    });
    expect(okRes.json().ok).toBe(true);
    expect(okRes.json().grantToken).toBeTruthy();
  });

  it("list endpoint includes restrictedEmail", async () => {
    const authToken = makeAuthToken({ sub: seed.user.id, email: seed.user.email, name: seed.user.name });

    const res = await app.inject({
      method: "GET",
      url: `/api/videos/${seed.video.id}/share-links`,
      headers: { authorization: `Bearer ${authToken}` },
    });

    expect(res.statusCode).toBe(200);
    const links = res.json();
    const emailLink = links.find((l: any) => l.token === emailLinkToken);
    expect(emailLink).toBeDefined();
    expect(emailLink.restrictedEmail).toBe("allowed@example.com");
  });
});
