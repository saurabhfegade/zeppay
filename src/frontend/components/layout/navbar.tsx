import React from "react";
import {
  Box,
  Flex,
  HStack,
  Button,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Avatar,
  VStack,
  useDisclosure,
  Link,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { useAuthStore, AuthState } from "../../store/auth-store";
import { useLogoutMutation } from "../../hooks/mutations/use-logout-mutation";
import NextLink from "next/link";
interface NavItem {
  label: string;
  href: string;
  authRequired?: boolean;
  roles?: Array<"sponsor" | "vendor">;
}

const commonNavItems: NavItem[] = [];

const sponsorNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/sponsor/dashboard",
    authRequired: true,
    roles: ["sponsor"],
  },
  {
    label: "Sponsorships",
    href: "/sponsor/sponsorships",
    authRequired: true,
    roles: ["sponsor"],
  },
  {
    label: "Beneficiaries",
    href: "/sponsor/beneficiaries",
    authRequired: true,
    roles: ["sponsor"],
  },
  {
    label: "Transactions",
    href: "/sponsor/transactions",
    authRequired: true,
    roles: ["sponsor"],
  },
];

const vendorNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/vendor/dashboard",
    authRequired: true,
    roles: ["vendor"],
  },
  {
    label: "My Transactions",
    href: "/vendor/transactions",
    authRequired: true,
    roles: ["vendor"],
  },
  {
    label: "Profile/Categories",
    href: "/vendor/profile",
    authRequired: true,
    roles: ["vendor"],
  },
];

const NavLink = ({ label, href }: { label: string; href: string }) => {
  const linkColor = "gray.600";
  const hoverBg = "gray.200";

  return (
    <Link
      as={NextLink}
      href={href}
      px={2}
      py={1}
      rounded={"md"}
      fontWeight={"normal"}
      color={linkColor}
      _hover={{
        textDecoration: "none",
        bg: hoverBg,
      }}
    >
      {label}
    </Link>
  );
};

export const Navbar = () => {
  const user = useAuthStore((state: AuthState) => state.user);
  const isAuthenticated = useAuthStore(
    (state: AuthState) => state.isAuthenticated,
  );
  const {
    isOpen: mobileNavOpen,
    onOpen: openMobileNav,
    onClose: closeMobileNav,
  } = useDisclosure();
  const logoutMutation = useLogoutMutation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  let visibleNavItems: NavItem[] = [...commonNavItems];
  if (isAuthenticated) {
    if (user?.role === "sponsor") {
      visibleNavItems = [...visibleNavItems, ...sponsorNavItems];
    } else if (user?.role === "vendor") {
      visibleNavItems = [...visibleNavItems, ...vendorNavItems];
    }
  }

  const bg = "white";
  const borderColor = "gray.200";
  const brandColor = "blue.600";

  return (
    <Box
      bg={bg}
      px={4}
      shadow="sm"
      borderBottom="1px"
      borderColor={borderColor}
    >
      <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
        <IconButton
          size={"md"}
          icon={mobileNavOpen ? <CloseIcon /> : <HamburgerIcon />}
          aria-label={mobileNavOpen ? "Close Menu" : "Open Menu"}
          display={{ md: "none" }}
          onClick={mobileNavOpen ? closeMobileNav : openMobileNav}
          variant="ghost"
        />
        <HStack spacing={8} alignItems={"center"}>
          <Link as={NextLink} href="/" _hover={{ textDecoration: "none" }}>
            <Text fontSize="xl" fontWeight="bold" color={brandColor}>
              ZepPay
            </Text>
          </Link>
          <HStack as={"nav"} spacing={4} display={{ base: "none", md: "flex" }}>
            {visibleNavItems.map((item) => (
              <NavLink key={item.label} label={item.label} href={item.href} />
            ))}
          </HStack>
        </HStack>
        <Flex alignItems={"center"}>
          {!isAuthenticated ? (
            <HStack spacing={2}>
              <Link as={NextLink} href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link as={NextLink} href="/signup">
                <Button colorScheme="brand">Sign Up</Button>
              </Link>
            </HStack>
          ) : (
            <Menu>
              <MenuButton
                as={Button}
                variant={"ghost"}
                cursor={"pointer"}
                minW={0}
                rounded={"full"}
                rightIcon={<ChevronDownIcon />}
                isLoading={logoutMutation.isPending}
              >
                <HStack spacing={1}>
                  <Avatar size="sm" name={user?.display_name || user?.email} />
                  <Text
                    display={{ base: "none", md: "inline-flex" }}
                    fontWeight="normal"
                  >
                    {user?.display_name || user?.email}
                  </Text>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem
                  onClick={handleLogout}
                  isDisabled={logoutMutation.isPending}
                >
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          )}
        </Flex>
      </Flex>

      {mobileNavOpen && (
        <Box pb={4} display={{ md: "none" }}>
          <VStack as={"nav"} spacing={4} alignItems="stretch">
            {visibleNavItems.map((item) => (
              <NavLink key={item.label} label={item.label} href={item.href} />
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
};
