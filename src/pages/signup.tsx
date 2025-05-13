import { NextPage } from "next";
// import { useRouter } from 'next/router'; // Router currently unused
import React from "react"; // Keep React import for JSX
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Input,
  VStack,
  Heading,
  Box,
  Text,
  Select,
  createListCollection,
  Portal,
} from "@chakra-ui/react";
import { useAuth } from "../frontend/hooks/use-auth"; // Relative path
import {
  signupSchema,
  SignupPayload,
} from "../backend/validation/auth-schemas"; // Relative path
import Link from "next/link";
import type { ApiErrorResponse } from "../common/types/api"; // For authError type
import { toaster } from "../components/ui/toaster"; // Ensure this import
import { Field } from "../components/ui/field";
// Removed imports from ../components/ui/select

const SignupPage: NextPage = () => {
  // const router = useRouter(); // Router currently unused
  // NO useToast() here
  const { signup, isLoading, error: authError } = useAuth();

  const {
    register,
    handleSubmit,
    control, // Added control for RHF Controller
    formState: { errors, isSubmitting },
  } = useForm<SignupPayload>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      // Set default value for role if needed
      role: undefined, // Or '' if your schema prefers empty string
    },
  });

  const onSubmit: SubmitHandler<SignupPayload> = async (data) => {
    try {
      await signup(data);
    } catch (err) {
      // Catching general error from signup.mutateAsync if it throws
      const apiError = err as ApiErrorResponse;
      console.error("Raw signup submission error:", apiError);
      toaster.create({
        // Use toaster.create with type: 'error'
        title: "Signup Failed",
        description:
          apiError.message || "An unexpected error occurred during signup.",
        type: "error",
        // duration and isClosable are typically set in toaster setup or as part of specific methods if supported
      });
    }
  };

  const roleOptions = [
    { label: "Sponsor", value: "sponsor" },
    { label: "Vendor", value: "vendor" },
  ];

  // Create the collection for the Select component
  const roleCollection = createListCollection({ items: roleOptions });

  return (
    <Box
      maxW="md"
      mx="auto"
      p={6}
      borderWidth={1}
      borderRadius="lg"
      boxShadow="lg"
    >
      <Heading as="h1" mb={6} textAlign="center">
        Create Account
      </Heading>
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack gap={4}>
          <Field label="Email address" errorText={errors.email?.message}>
            <Input id="email" type="email" {...register("email")} />
          </Field>

          <Field label="Password" errorText={errors.password?.message}>
            <Input id="password" type="password" {...register("password")} />
          </Field>

          <Field
            label="Display Name (Optional)"
            errorText={errors.display_name?.message}
          >
            <Input id="display_name" {...register("display_name")} />
          </Field>

          <Field
            label="Phone Number (Optional)"
            errorText={errors.phone_number?.message}
          >
            <Input id="phone_number" type="tel" {...register("phone_number")} />
          </Field>

          <Field label="Role" errorText={errors.role?.message}>
            <Controller
              name="role"
              control={control}
              render={({ field: { onChange, value, name, ref } }) => (
                <Select.Root
                  collection={roleCollection} // Pass the collection
                  value={value ? [value] : []}
                  onValueChange={(details) => {
                    const newValue =
                      details.value && details.value.length > 0
                        ? details.value[0]
                        : undefined;
                    onChange(newValue);
                  }}
                >
                  {/* HiddenSelect is crucial for form integration */}
                  <Select.HiddenSelect name={name} ref={ref} />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder="Select role" />
                    </Select.Trigger>
                    {/* Optional: Indicator can go here or inside IndicatorGroup */}
                    {/* <Select.Indicator /> */}
                  </Select.Control>
                  <Portal>
                    {" "}
                    {/* Use Portal for better layering */}
                    <Select.Positioner>
                      <Select.Content>
                        {roleCollection.items.map(
                          (
                            item, // Map over collection items
                          ) => (
                            <Select.Item key={item.value} item={item}>
                              {/* Render label from item */}
                              <Select.ItemText>{item.label}</Select.ItemText>
                              <Select.ItemIndicator />
                            </Select.Item>
                          ),
                        )}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              )}
            />
          </Field>

          {authError && (
            <Text color="red.500" textAlign="center">
              {(authError as ApiErrorResponse).message ||
                "An authentication error occurred."}
            </Text>
          )}

          <Button
            type="submit"
            colorScheme="purple"
            loading={isLoading || isSubmitting}
            width="full"
          >
            Sign Up
          </Button>
        </VStack>
      </form>
      <Text mt={4} textAlign="center">
        Already have an account?{" "}
        <Link href="/login" passHref>
          <Button variant="ghost" colorScheme="purple">
            Log In
          </Button>
        </Link>
      </Text>
    </Box>
  );
};

export default SignupPage;
