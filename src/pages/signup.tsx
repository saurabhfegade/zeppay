import { useState } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useSignUpMutation } from "@/frontend/hooks";
import { UserRole } from "@/common/types/auth.d";
import {
  Box,
  Button,
  Input,
  Heading,
  Stack,
  Container,
  Text,
  Select,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Link,
  useToast,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { ME_QUERY_KEY } from "@/frontend/hooks/queries/use-get-me-query";

const SignUpPage: NextPage = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const router = useRouter();

  const { mutate: signUp, isPending: isSigningUp } = useSignUpMutation({
    onSuccess: (data) => {
      console.log("Account created:", data);
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      toast({
        title: "Account created.",
        description:
          "Your account has been successfully created. Please log in.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      router.push("/login");
    },
    onError: (error) => {
      console.error("Sign up failed:", error.message);
      const errorMessage =
        typeof error.message === "string"
          ? error.message
          : "An unexpected error occurred";
      setErrors((prev) => ({ ...prev, form: errorMessage }));
    },
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("sponsor");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!displayName) newErrors.displayName = "Display name is required";
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!role) newErrors.role = "Role is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;
    signUp({
      email,
      password,
      role,
      display_name: displayName,
      phone_number: phoneNumber || undefined,
    });
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
          Create Account
        </Heading>
        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            {errors.form && (
              <Box my={4} p={3} bg="red.100" borderRadius="md">
                <Text color="red.700">{errors.form}</Text>
              </Box>
            )}
            <FormControl
              id="displayName"
              isInvalid={!!errors.displayName}
              isRequired
            >
              <FormLabel>Display Name</FormLabel>
              <Input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                aria-invalid={!!errors.displayName}
              />
              {errors.displayName && (
                <FormErrorMessage>{errors.displayName}</FormErrorMessage>
              )}
            </FormControl>

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

            <FormControl id="role" isInvalid={!!errors.role} isRequired>
              <FormLabel>Role</FormLabel>
              <Select
                value={role}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setRole(e.target.value as UserRole)
                }
                aria-invalid={!!errors.role}
              >
                <option value="sponsor">Sponsor</option>
                <option value="vendor">Vendor</option>
              </Select>
              {errors.role && (
                <FormErrorMessage>{errors.role}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl id="phoneNumber">
              <FormLabel>Phone Number (Optional)</FormLabel>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              width="full"
              isLoading={isSigningUp}
            >
              Sign Up
            </Button>
          </Stack>
        </form>
        <Box mt={6} textAlign="center">
          <Text>
            Already have an account?{" "}
            <Link href="/login" color="blue.500">
              Login
            </Link>
          </Text>
        </Box>
      </Box>
    </Container>
  );
};

export default SignUpPage;
