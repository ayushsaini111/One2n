import { z } from "zod";

export const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .email("Invalid email address")
    .nonempty("Email is required"), 
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long"), 
});


export const loginSchema = z.object({
    email: z
      .string()
      .email("Invalid email address")
      .nonempty("Email is required"), 
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long"), 
  });


  // Zod schema for verifying OTP (both email and OTP are required)
  export const verifyCodeSchema = z.object({
    code: z.string().min(6, "Code must be 6 digits"),
    email: z.string().email("Invalid email format"),
});

