import type { User as AppUser } from "../types/user.ts";

declare global {
  namespace Express {
    interface User extends AppUser {}
  }
}

export {};
