import { Container, Heading, Text, Box } from '@chakra-ui/react';

export default function Home() {
  return (
    <Container maxW="container.xl" py={10}>
      <Box display="flex" flexDirection="column" gap={6}>
        <Heading as="h1" size="2xl" textAlign="center">
          Welcome to ZepPay
        </Heading>
        <Text fontSize="xl" textAlign="center">
          A secure remittance platform powered by Coinbase
        </Text>
      </Box>
    </Container>
  );
} 