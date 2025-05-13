import React from "react";
import { Box, Flex, Text, Spacer, Container } from "@chakra-ui/react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      as="footer"
      mt={8}
      py={4}
      borderTopWidth="1px"
      bg="gray.100"
      position="fixed"
      bottom={0}
      width="100%"
    >
      <Container maxW="container.xl">
        <Flex direction={{ base: "column", md: "row" }} align="center">
          <Text fontSize="sm" fontWeight="bold">
            ZepPay
          </Text>
          <Spacer />
          <Text fontSize="sm" color="gray.600" mt={{ base: 2, md: 0 }}>
            &copy; {currentYear} ZepPay. All rights reserved.
          </Text>
        </Flex>
      </Container>
    </Box>
  );
};
