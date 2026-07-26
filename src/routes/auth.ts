import { eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { users } from "../db/schema";
import { signAuthToken } from "../lib/jwt";
import { hashPassword, verifyPassword } from "../lib/password";

const router = Router();

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

router.post("/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password, name } = parsed.data;

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, name, role: "CLIENT" })
    .returning();

  const token = signAuthToken({ sub: user.id, role: user.role });
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signAuthToken({ sub: user.id, role: user.role });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

export default router;
