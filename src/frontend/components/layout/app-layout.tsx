import React from "react";
import { Container, Flex } from "@chakra-ui/react";
import { Navbar } from "../common/navbar";
import { Footer } from "../common/footer";
// import { useAuth } from '../../hooks/use-auth'; // Relative path, currently unused
// import { initializeAuthState, useAuthStore, AuthState } from '../../store/auth-store'; // Relative path, added AuthState

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  // Example: Show a global loading spinner based on auth state (Optional)
  // const isLoadingFromStore = useAuthStore((state) => state.isLoading);
  // if (isLoadingFromStore) {
  //   console.log('App is in auth loading state...');
  // }

  return (
    <Flex direction="column" minHeight="100vh">
      <Navbar />
      <Flex as="main" flex="1" py={6}>
        <Container maxW="container.xl" width="100%">
          {children}
        </Container>
      </Flex>
      <Footer />
    </Flex>
  );
};

export default AppLayout;
