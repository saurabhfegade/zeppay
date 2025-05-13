import React from "react";
import {
  Box,
  Heading,
  Input,
  Button,
  Text,
  VStack,
  Flex,
} from "@chakra-ui/react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { NextPage } from "next";
import Link from "next/link";
import { useAuth } from "../frontend/hooks/use-auth";
import { Field } from "../components/ui/field";

// Define Zod schema for login form validation
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: NextPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { login, isLoading, error: authError } = useAuth();

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    try {
      await login(data);
    } catch (error) {
      console.error("Login submission failed:", error);
    }
  };

  return (
    <Flex align="center" justify="center">
      <Box
        p={8}
        maxWidth="md"
        borderWidth={1}
        borderRadius={8}
        boxShadow="lg"
        bg="white"
        w="100%"
      >
        <VStack as="form" onSubmit={handleSubmit(onSubmit)} gap={4}>
          <Heading mb={2}>Login to ZepPay</Heading>

          <Field label="Email Address" errorText={errors.email?.message}>
            <Input id="email" type="email" {...register("email")} />
          </Field>

          <Field label="Password" errorText={errors.password?.message}>
            <Input id="password" type="password" {...register("password")} />
          </Field>

          <Button
            type="submit"
            colorScheme="teal"
            width="full"
            loading={isLoading}
            disabled={isLoading}
          >
            Login
          </Button>

          {authError && (
            <Text color="red.500" textAlign="center" fontSize="sm">
              Login failed. Please check your credentials.
            </Text>
          )}

          <Text fontSize="sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" passHref>
              <Button
                as="a"
                variant="ghost"
                colorScheme="teal"
                size="sm"
                ml={1}
              >
                Sign Up
              </Button>
            </Link>
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
};

export default LoginPage;
