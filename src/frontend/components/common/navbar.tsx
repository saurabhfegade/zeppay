import React from "react";
import {
  Box,
  Flex,
  Heading,
  Spacer,
  Button,
  IconButton,
} from "@chakra-ui/react";
import { FaUserCircle } from "react-icons/fa";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useAuthStore } from "frontend/store/auth-store";

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
      console.log("Logout successful (toaster call removed for testing)");
    } catch (error) {
      console.error("Logout failed:", error);
      alert(
        "Logout failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };

  return (
    <Flex
      as="nav"
      align="center"
      justify="space-between"
      wrap="wrap"
      padding={{ base: "1rem", md: "1.5rem" }}
      bg="gray.50"
      color="black"
      boxShadow="md"
      position="sticky"
      top={0}
      zIndex={1100}
      w="100%"
    >
      <Flex align="center" mr={5}>
        <NextLink
          href={
            isAuthenticated
              ? user?.role === "sponsor"
                ? "/sponsor/dashboard"
                : "/vendor/dashboard"
              : "/"
          }
          passHref
        >
          <Heading
            as="h1"
            size="lg"
            letterSpacing={"-.05rem"}
            cursor="pointer"
            _hover={{ color: "teal.300" }}
          >
            ZepPay
          </Heading>
        </NextLink>
      </Flex>

      <Spacer />

      <Box>
        {isAuthenticated && user ? (
          <Flex align="center">
            <IconButton
              aria-label="User Menu (temp)"
              colorScheme="whiteAlpha"
              size="md"
              _hover={{ bg: "gray.700" }}
              _active={{ bg: "gray.600" }}
            >
              <FaUserCircle size="24px" />
            </IconButton>
            <Button
              variant="ghost"
              colorScheme="whiteAlpha"
              ml={2}
              onClick={handleLogout}
              size="sm"
            >
              Logout
            </Button>
          </Flex>
        ) : (
          <Flex align="center">
            <NextLink href="/login" passHref>
              <Button
                variant="outline"
                mr={3}
                colorScheme="whiteAlpha"
                _hover={{ bg: "gray.700" }}
              >
                Login
              </Button>
            </NextLink>
            <NextLink href="/signup" passHref>
              <Button
                variant="solid"
                colorScheme="teal"
                _hover={{ bg: "teal.400" }}
              >
                Sign Up
              </Button>
            </NextLink>
          </Flex>
        )}
      </Box>
    </Flex>
  );
};
