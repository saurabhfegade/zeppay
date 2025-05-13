import "next";
import { User } from "./db"; // Assuming User type is in db.d.ts

declare module "next" {
  interface NextApiRequest {
    userId?: string; // As used in the API routes
    user?: User; // Optional: if the full user object is sometimes attached by withAuth
  }
}
