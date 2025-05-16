import React from "react";
import {
  Box,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tag,
  Link as ChakraLink,
  Tooltip,
  Button,
  Flex,
} from "@chakra-ui/react";
import {
  useGetSponsorSponsorshipsQuery,
  EnrichedSponsorship,
} from "@/frontend/hooks/queries/use-get-sponsor-sponsorships-query";
import NextLink from "next/link";

const SponsorshipStatusTag = ({ status }: { status: string }) => {
  let colorScheme = "gray";
  switch (status.toLowerCase()) {
    case "active":
      colorScheme = "green";
      break;
    case "depleted":
      colorScheme = "orange";
      break;
    case "cancelled":
      colorScheme = "red";
      break;
    case "expired": // Assuming you might add this status
      colorScheme = "purple";
      break;
  }
  return (
    <Tag colorScheme={colorScheme} size="sm">
      {status.toUpperCase()}
    </Tag>
  );
};

const SponsorSponsorshipsPage = () => {
  const {
    data: sponsorships,
    isLoading,
    isError,
    error,
  } = useGetSponsorSponsorshipsQuery();

  const renderSponsorshipRow = (sponsorship: EnrichedSponsorship) => {
    const beneficiaryDisplay =
      sponsorship.beneficiary?.display_name ||
      sponsorship.beneficiary?.phone_number_for_telegram ||
      sponsorship.beneficiary_id;
    return (
      <Tr key={sponsorship.id}>
        <Td>
          <Tooltip label={sponsorship.id} placement="top" gutter={8}>
            <ChakraLink
              as={NextLink}
              href={`/sponsor/sponsorships/${sponsorship.id}`}
              passHref
              textDecor="underline"
              _hover={{ color: "blue.500" }}
            >
              {sponsorship.id.substring(0, 8)}...
            </ChakraLink>
          </Tooltip>
        </Td>
        <Td>
          {sponsorship.beneficiary ? (
            <Tooltip
              label={`ID: ${sponsorship.beneficiary_id}`}
              placement="top"
            >
              <Text>{beneficiaryDisplay}</Text>
            </Tooltip>
          ) : (
            sponsorship.beneficiary_id
          )}
        </Td>
        <Td isNumeric>
          {sponsorship.total_allocated_usdc.toLocaleString(undefined, {
            style: "currency",
            currency: "USD",
          })}
        </Td>
        <Td isNumeric>
          {sponsorship.remaining_usdc.toLocaleString(undefined, {
            style: "currency",
            currency: "USD",
          })}
        </Td>
        <Td>
          <SponsorshipStatusTag status={sponsorship.status} />
        </Td>
        <Td>
          {sponsorship.notes ? (
            <Tooltip
              label={sponsorship.notes}
              placement="top-start"
              maxW="300px"
              whiteSpace="pre-wrap"
            >
              <Text noOfLines={1}>{sponsorship.notes}</Text>
            </Tooltip>
          ) : (
            <Text as="em" color="gray.500">
              N/A
            </Text>
          )}
        </Td>
        <Td>{new Date(sponsorship.created_at).toLocaleDateString()}</Td>
        <Td>
          {sponsorship.expires_at ? (
            new Date(sponsorship.expires_at).toLocaleDateString()
          ) : (
            <Text as="em" color="gray.500">
              N/A
            </Text>
          )}
        </Td>
      </Tr>
    );
  };

  return (
    <Box p={{ base: 4, md: 6 }}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading as="h1" size="xl">
          My Sponsorships
        </Heading>
        <Button as={NextLink} href="/sponsor/dashboard" colorScheme="brand">
          Create New Sponsorship
        </Button>
      </Flex>

      {isLoading && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <Spinner size="xl" />
          <Text ml={4}>Loading your sponsorships...</Text>
        </Box>
      )}

      {isError && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Error Fetching Sponsorships!</AlertTitle>
            <AlertDescription display="block">
              {error?.message ||
                "An unexpected error occurred while loading your sponsorships."}
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {!isLoading && !isError && sponsorships && sponsorships.length === 0 && (
        <Box
          textAlign="center"
          p={10}
          borderWidth={1}
          borderRadius="md"
          boxShadow="sm"
        >
          <Heading as="h3" size="md" mb={2}>
            No Sponsorships Yet
          </Heading>
          <Text mb={4}>
            You haven&apos;t created any sponsorships. Get started by creating
            one from your dashboard!
          </Text>
          <Button as={NextLink} href="/sponsor/dashboard" colorScheme="teal">
            Go to Dashboard
          </Button>
        </Box>
      )}

      {!isLoading && !isError && sponsorships && sponsorships.length > 0 && (
        <TableContainer borderWidth={1} borderRadius="md" boxShadow="sm">
          <Table variant="simple" size="md">
            <Thead bg="gray.50">
              <Tr>
                <Th>ID</Th>
                <Th>Beneficiary</Th>
                <Th isNumeric>Total Allocated (USDC)</Th>
                <Th isNumeric>Remaining (USDC)</Th>
                <Th>Status</Th>
                <Th>Notes</Th>
                <Th>Created At</Th>
                <Th>Expires At</Th>
              </Tr>
            </Thead>
            <Tbody>{sponsorships.map(renderSponsorshipRow)}</Tbody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default SponsorSponsorshipsPage;
