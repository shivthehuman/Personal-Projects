import type { UserRole } from "@b2b/shared";

declare global {
  namespace Express {
    export interface AuthUserPayload {
      id: string;
      email: string;
      role: UserRole;
      organizationId: string;
    }

    interface Request {
      authUser?: AuthUserPayload;
    }
  }
}

export {};
