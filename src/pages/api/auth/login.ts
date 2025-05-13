import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "backend/lib/supabase-admin"; // Assuming admin client is here
import { handleError, AppError } from "backend/lib/error-handler";
import type { User } from "common/types/db";
import type { ApiErrorResponse, ApiSuccessResponse } from "common/types/api";
import { z } from "zod";

// Basic validation for login payload
const loginPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1), // Basic check, Supabase handles complexity
});

async function loginHandler(
  req: NextApiRequest,
  res: NextApiResponse<ApiSuccessResponse<User> | ApiErrorResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return handleError(
      res,
      new AppError({
        message: `Method ${req.method} Not Allowed`,
        statusCode: 405,
      }),
    );
  }

  // Validate request body
  const validation = loginPayloadSchema.safeParse(req.body);
  if (!validation.success) {
    return handleError(
      res,
      new AppError({
        message: "Invalid request body",
        statusCode: 400,
        originalError: validation.error,
      }),
    );
  }

  const { email, password } = validation.data;

  try {
    // 1. Sign in with Supabase Auth (using admin client)
    // Note: Using admin client's signIn might behave slightly differently than client-side regarding session setting,
    // but it allows us to verify credentials server-side. Client will still need session from subsequent requests.
    // Alternatively, could use client SDK here if preferred, but admin ensures bypass of RLS for profile fetch.
    const { data: authResponse, error: signInError } =
      await supabaseAdmin.auth.signInWithPassword({
        email: email,
        password: password,
      });

    if (signInError || !authResponse?.user) {
      // Use a generic message for security - don't reveal if email exists but password is wrong
      return handleError(
        res,
        new AppError({
          message: "Invalid credentials",
          statusCode: 401,
          originalError: signInError,
        }),
      );
    }

    const userId = authResponse.user.id;

    // 2. Fetch user profile from public.users table (using admin client)
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("users") // Ensure table name is correct
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      // Log the specific error, but return a generic server error to the client
      console.error(`Error fetching profile for user ${userId}:`, profileError);
      return handleError(
        res,
        new AppError({
          message: "Failed to retrieve user profile after login.",
          statusCode: 500,
          originalError: profileError,
        }),
      );
    }

    if (!userProfile) {
      console.error(
        `Profile not found for user ${userId} after successful login.`,
      );
      return handleError(
        res,
        new AppError({ message: "User profile not found.", statusCode: 404 }),
      );
    }

    // Ensure role exists (optional but good practice)
    if (!userProfile.role) {
      console.error(`Role not found for user ${userId} in profile.`);
      return handleError(
        res,
        new AppError({
          message: "User profile missing role.",
          statusCode: 500,
        }),
      );
    }

    // 3. Return the complete user profile (adjust as needed based on User type)
    // Important: Ensure the returned object matches the User type expected by the frontend store
    const finalUserData: User = {
      ...userProfile,
      id: userId, // Ensure auth ID is primary
      email: authResponse.user.email, // Ensure auth email is primary
    };

    return res.status(200).json({
      success: true,
      data: finalUserData,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Unexpected error during login:", error);
    return handleError(
      res,
      new AppError({
        message: "An unexpected error occurred during login.",
        statusCode: 500,
        originalError: error,
      }),
    );
  }
}

export default loginHandler;
