import { useState } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useLoginMutation } from "@/frontend/hooks";
import {
  Box,
  Button,
  Input,
  Heading,
  Stack,
  Container,
  Text,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Link,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { ME_QUERY_KEY } from "@/frontend/hooks/queries/use-get-me-query";
import { useAuthStore } from "@/frontend/store/auth-store";

const LoginPage: NextPage = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate: login, isPending: isLoggingIn } = useLoginMutation({
    onSuccess: async (data) => {
      console.log("Login successful:", data);

      if (data.user && data.session && data.session.access_token) {
        const supabaseUser = data.user;
        const appRole =
          (supabaseUser.user_metadata?.role as string) || supabaseUser.role;
        const displayName =
          (supabaseUser.user_metadata?.display_name as string) || "";

        // Construct user object for the auth store, ensuring the application role is at the top level.
        // This structure should align with what AppLayout expects and how AppUser is defined.
        const userForStore = {
          ...supabaseUser,
          role: appRole,
          display_name: displayName,
          // Explicitly map other fields if AppUser type in auth-store is more specific
          // or doesn't perfectly align with SupabaseUser + overrides.
          // For now, this covers the critical 'role' and 'display_name'.
        };

        useAuthStore
          .getState()
          .setUser(userForStore, data.session.access_token);
      } else {
        console.error(
          "Login success but token or user is missing in the response data:",
          data,
        );
        setErrors((prev) => ({
          ...prev,
          form: "Login successful, but session could not be established.",
        }));
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });

      // Use the application role from user_metadata for redirection
      const redirectRole = data.user.user_metadata?.role || data.user.role;
      if (redirectRole === "vendor") {
        router.push("/vendor/dashboard");
      } else if (redirectRole === "sponsor") {
        router.push("/sponsor/dashboard");
      } else {
        router.push("/");
      }
    },
    onError: (error) => {
      console.error("Login failed:", error.message);
      const errorMessage =
        typeof error.message === "string"
          ? error.message
          : "An unexpected error occurred";
      setErrors((prev) => ({ ...prev, form: errorMessage }));
    },
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;
    login({ email, password });
  };

  return (
    <Container centerContent py={12}>
      <Box
        width={{ base: "90%", md: "400px" }}
        p={8}
        borderWidth={1}
        borderRadius="md"
        boxShadow="lg"
      >
        <Heading as="h1" size="lg" textAlign="center" mb={6}>
          Login
        </Heading>
        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            {errors.form && (
              <Box my={4} p={3} bg="red.100" borderRadius="md">
                <Text color="red.700">{errors.form}</Text>
              </Box>
            )}
            <FormControl id="email" isInvalid={!!errors.email} isRequired>
              <FormLabel>Email address</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl id="password" isInvalid={!!errors.password} isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              )}
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              width="full"
              isLoading={isLoggingIn}
            >
              Login
            </Button>
          </Stack>
        </form>
        <Box mt={6} textAlign="center">
          <Text>
            Don&apos;t have an account?{" "}
            <Link href="/signup" color="blue.500">
              Sign up
            </Link>
          </Text>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
