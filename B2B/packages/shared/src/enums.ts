import { z } from "zod";

export const userRoleSchema = z.enum(["buyer", "seller", "transporter", "admin"]);

export type UserRole = z.infer<typeof userRoleSchema>;

export const orgTypeSchema = z.enum(["buyer", "seller", "transporter", "other"]);

export type OrgType = z.infer<typeof orgTypeSchema>;
