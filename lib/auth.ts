// lib/auth.ts
import jwt from "jsonwebtoken";

export async function authUser(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as { id: string; email: string };
    return decoded;
  } catch (error) {
    throw new Error("Invalid token");
  }
}
