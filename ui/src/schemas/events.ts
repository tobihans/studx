import { string, object, date, bool } from "yup";
import type { InferType } from "yup";

export const CreateEventSchema = object().shape({
  title: string().required(),
  description: string(),
  startsAt: date().required(),
  endsAt: date().required(),
  attendees: string(),
  addMeetingLink: bool(),
});

export interface CreateEventRequest
  extends InferType<typeof CreateEventSchema> {}
