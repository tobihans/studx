import type { Organization } from "@/schemas/organization";
import type { User } from "@/schemas/auth";

type OrganizationField = Organization & { type: "Organization" };
type UserField = User & { type: "User" };
type GenericNotificationField = UserField | OrganizationField;

export interface Notification {
  pk: number;
  actor: GenericNotificationField;
  actionObject: GenericNotificationField;
  verb: string;
  target: GenericNotificationField;

  timestamp: string;
}
