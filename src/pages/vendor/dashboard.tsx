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
  HStack,
  useDisclosure,
  useToast,
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
        <HStack justifyContent="space-between" alignItems="center">
          <Heading as="h1" size="xl">
            Vendor Dashboard
          </Heading>
          <Button
            colorScheme="brand"
            onClick={handleOpenPaymentModal}
            isDisabled={!categoriesExist || isLoading}
          >
            Accept Payment
          </Button>
        </HStack>

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
          <Alert status="success" mb={6} colorScheme="brand">
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

        {/* <Box mt={6} p={6} borderWidth="1px" borderRadius="lg" shadow="md">
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
        </Box> */}
      </VStack>
    </Box>
  );
};

export default VendorDashboardPage;
