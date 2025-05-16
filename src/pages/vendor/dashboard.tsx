import { NextPage } from "next";
import Link from "next/link";
import { useVendorProfileStore } from "@/frontend/store/vendor-profile-store";
import { useGetVendorCategoriesQuery } from "@/frontend/hooks/queries/use-get-vendor-categories-query";
import { useGetEligibleSponsorshipsQuery } from "@/frontend/hooks/queries/use-get-eligible-sponsorships-query";
import {
  Box,
  Heading,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Spinner,
  VStack,
  Flex,
  useDisclosure,
  useToast,
  Stack,
} from "@chakra-ui/react";
import { AcceptPaymentModal } from "@/frontend/components/vendor/accept-payment-modal";

export interface SelectedSponsorshipDetails {
  sponsorshipId: string;
  beneficiaryName: string;
  beneficiaryId: string;
  beneficiaryPhoneNumber: string;
  sponsorshipAllowedCategoryId: string;
  categoryId: string;
  categoryName: string;
  maxAmount: number;
}

interface QueryErrorWithValue {
  message: string;
}

const VendorDashboardPage: NextPage = () => {
  const {
    isLoading: isLoadingVendorOwnCategories,
    error: errorVendorOwnCategories,
  } = useGetVendorCategoriesQuery();
  const assignedCategories = useVendorProfileStore(
    (state) => state.assignedCategories,
  );
  const categoriesExist = assignedCategories.length > 0;
  const toast = useToast();

  const {
    isOpen: isPaymentModalOpen,
    onOpen: onPaymentModalOpen,
    onClose: onPaymentModalClose,
  } = useDisclosure();
  const {
    data: eligibleSponsorships,
    isLoading: isLoadingEligibleSponsorships,
    error: errorEligibleSponsorships,
  } = useGetEligibleSponsorshipsQuery();

  const handleOpenPaymentModal = () => {
    if (!categoriesExist) {
      toast({
        title: "Profile Incomplete",
        description: "Please assign a category to your business first.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    onPaymentModalOpen();
  };

  const isLoading =
    isLoadingVendorOwnCategories || isLoadingEligibleSponsorships;
  const pageError: unknown =
    errorVendorOwnCategories || errorEligibleSponsorships;

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "object" && error !== null && "message" in error) {
      const typedError = error as QueryErrorWithValue;
      if (typeof typedError.message === "string") {
        return typedError.message;
      }
    }
    return "An unexpected error occurred.";
  };

  return (
    <Box p={8}>
      <VStack spacing={6} align="stretch">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading as="h1" size="xl" mb={4}>
            Vendor Dashboard
          </Heading>
          {categoriesExist && !isLoading && (
            <Button
              colorScheme="brand"
              onClick={handleOpenPaymentModal}
              isDisabled={!categoriesExist || isLoading}
            >
              Accept Payment
            </Button>
          )}
          {!categoriesExist && !isLoading && (
            <Box
              p={4}
              borderWidth="1px"
              borderRadius="md"
              bg="yellow.50"
              borderColor="yellow.200"
            >
              <Text fontWeight="medium" color="yellow.800">
                No Payment Categories Assigned
              </Text>
              <Text mt={2} color="yellow.700">
                You must have at least one payment category assigned to your
                profile to accept payments.
              </Text>
              <Link href="/vendor/profile" passHref>
                <Button as="a" colorScheme="brand" mt={4}>
                  Go to Profile to Assign Category
                </Button>
              </Link>
            </Box>
          )}
        </Flex>

        {isLoading && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100px"
          >
            <Spinner size="lg" />
            <Text ml={3}>Loading your details...</Text>
          </Box>
        )}

        {pageError != null && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Error loading your information!</AlertTitle>
            <AlertDescription>{getErrorMessage(pageError)}</AlertDescription>
          </Alert>
        )}

        {!isLoading && pageError == null && !categoriesExist && (
          <Alert
            status="warning"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            p={4}
            borderRadius="md"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Action Required: Set Your Business Category
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              To start receiving payments, please assign a category to your
              business.
            </AlertDescription>
            <Link href="/vendor/profile" passHref>
              <Button as="a" colorScheme="yellow" mt={4}>
                Go to Profile to Assign Category
              </Button>
            </Link>
          </Alert>
        )}

        {categoriesExist && (
          <Alert status="success" mb={6}>
            <AlertIcon />
            <AlertTitle>Profile Complete!</AlertTitle>
            <AlertDescription>
              Your business categories are set. You are ready to receive
              payments.
            </AlertDescription>
          </Alert>
        )}

        {isPaymentModalOpen && (
          <AcceptPaymentModal
            isOpen={isPaymentModalOpen}
            onClose={onPaymentModalClose}
            eligibleSponsorships={eligibleSponsorships || []}
            isLoadingEligibleSponsorships={isLoadingEligibleSponsorships}
            errorEligibleSponsorships={
              errorEligibleSponsorships as QueryErrorWithValue | null
            }
          />
        )}

        {!isLoading && pageError == null && categoriesExist && (
          <Box mt={0} p={6} borderWidth="1px" borderRadius="lg" shadow="md">
            <Heading as="h2" size="lg" mb={4}>
              Your Assigned Categories
            </Heading>
            <VStack align="start">
              {assignedCategories.map((cat) => (
                <Text key={cat.id}>- {cat.name}</Text>
              ))}
            </VStack>
            <Link href="/vendor/profile" passHref>
              <Button as="a" colorScheme="gray" mt={4} size="sm">
                Manage Categories
              </Button>
            </Link>
          </Box>
        )}

        <Box mt={6} p={6} borderWidth="1px" borderRadius="lg" shadow="md">
          <Heading as="h2" size="lg" mb={4}>
            Recent Transactions (Placeholder)
          </Heading>
          <Text>Transaction data will appear here.</Text>
        </Box>

        <Box mt={6} p={6} borderWidth="1px" borderRadius="lg" shadow="md">
          <Heading as="h2" size="lg" mb={4}>
            Account Overview (Placeholder)
          </Heading>
          <Text>Key account metrics will be displayed here.</Text>
        </Box>

        <Box mt={8} p={5} shadow="md" borderWidth="1px">
          <Heading size="lg" mb={4}>
            Quick Actions
          </Heading>
          <Stack direction={{ base: "column", md: "row" }} spacing={4}>
            <Link href="/vendor/profile" passHref>
              <Button as="a" colorScheme="gray" mt={4} size="sm">
                Manage Categories
              </Button>
            </Link>
            {/* Add other quick actions here, e.g., view transaction history */}
          </Stack>
        </Box>
      </VStack>
    </Box>
  );
};

export default VendorDashboardPage;
