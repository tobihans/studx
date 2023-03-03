import { string, object } from "yup";
import type { InferType } from "yup";

export const CreateOrganizationSchema = object().shape({
  name: string().required(),
  about: string(),
});

export interface CreateOrganizationRequest
  extends InferType<typeof CreateOrganizationSchema> {}

export interface Organization {
  name: string;
  slug: string;
  about: string;
  picture: string;
}
