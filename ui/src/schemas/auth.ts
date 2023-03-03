import { string, object } from "yup";
import type { InferType } from "yup";

export const SignUpSchema = object().shape({
  username: string().required(),
  email: string().email().required(),
  password: string().min(5).required(),
});

export interface SignUpRequest extends InferType<typeof SignUpSchema> {}

export const SignInSchema = object().shape({
  username: string().required(),
  password: string().min(5).required(),
});

export interface SignInRequest extends InferType<typeof SignInSchema> {}

export interface User {
  username: string;
  email: string;
  firstName: string;
  lastName: string;

  picture: string;

  role?: string;

  settings?: object;

  createdAt?: string;

  joinedAt?: string;
}
