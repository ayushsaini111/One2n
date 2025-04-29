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

// Zod schema for sending OTP (email is required)
export const sendOtpSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }).min(1, { message: "Email is required" }),
  });
  
  // Zod schema for verifying OTP (both email and OTP are required)
  export const verifyOtpSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }).min(1, { message: "Email is required" }),
    otp: z.string().length(6, { message: "OTP must be 6 digits" }), // Adjust OTP length as needed
  });
