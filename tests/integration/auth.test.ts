import { eq } from "drizzle-orm";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { app } from "../../src/app";
import { db } from "../../src/db";
import { users } from "../../src/db/schema";

const testEmails: string[] = [];

function uniqueEmail(prefix: string): string {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  testEmails.push(email);
  return email;
}

afterAll(async () => {
  for (const email of testEmails) {
    await db.delete(users).where(eq(users.email, email));
  }
});

describe("auth + RBAC", () => {
  it("registers a new user as CLIENT and returns a usable token", async () => {
    const email = uniqueEmail("register");
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, password: "correct-horse-1", name: "Test User" });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("CLIENT");
    expect(typeof res.body.token).toBe("string");
  });

  it("rejects registering the same email twice", async () => {
    const email = uniqueEmail("dupe");
    await request(app)
      .post("/api/auth/register")
      .send({ email, password: "correct-horse-1", name: "Test User" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, password: "correct-horse-1", name: "Test User" });

    expect(res.status).toBe(409);
  });

  it("rejects login with a wrong password", async () => {
    const email = uniqueEmail("wrongpass");
    await request(app)
      .post("/api/auth/register")
      .send({ email, password: "correct-horse-1", name: "Test User" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "not-the-password" });

    expect(res.status).toBe(401);
  });

  it("blocks unauthenticated access to an admin route", async () => {
    const res = await request(app).get("/api/admin/bookings");
    expect(res.status).toBe(401);
  });

  it("blocks a CLIENT-role token from an admin route", async () => {
    const email = uniqueEmail("client-forbidden");
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({ email, password: "correct-horse-1", name: "Test User" });

    const res = await request(app)
      .get("/api/admin/bookings")
      .set("Authorization", `Bearer ${registerRes.body.token}`);

    expect(res.status).toBe(403);
  });

  it("allows an ADMIN-role token to reach an admin route", async () => {
    const email = uniqueEmail("admin-allowed");
    await request(app)
      .post("/api/auth/register")
      .send({ email, password: "correct-horse-1", name: "Test User" });

    await db.update(users).set({ role: "ADMIN" }).where(eq(users.email, email));

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "correct-horse-1" });

    const res = await request(app)
      .get("/api/admin/bookings")
      .set("Authorization", `Bearer ${loginRes.body.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.bookings)).toBe(true);
  });
});
