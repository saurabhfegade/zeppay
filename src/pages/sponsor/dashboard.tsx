import {
  Box,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Select,
  CheckboxGroup,
  Checkbox,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  Input,
  useToast,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepDescription,
  StepSeparator,
  useSteps,
  VStack,
  HStack,
  Divider,
} from "@chakra-ui/react";
import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import { FundButton } from "@coinbase/onchainkit/fund";
import { useGetSponsorWaasWalletQuery } from "@/frontend/hooks/queries/use-get-sponsor-waas-wallet-query";
import { useGetSponsorBeneficiariesQuery } from "@/frontend/hooks/queries/use-get-sponsor-beneficiaries-query";
import { useGetCategoriesQuery } from "@/frontend/hooks/queries/use-get-categories-query";
import {
  useCreateSponsorshipMutation,
  CreateSponsorshipPayload,
} from "@/frontend/hooks/mutations/use-create-sponsorship-mutation";
import { Beneficiary } from "@/common/types/api";
import { Category } from "@/common/types/database.types";
import { coinbase_color } from "config";

// Define a type for common API error responses
interface ApiErrorResponse {
  error: string;
  details?: string;
}

const steps = [
  { title: "Select Beneficiary", description: "Choose who to sponsor" },
  { title: "Select Categories", description: "Pick spending categories" },
  {
    title: "Details & Amount",
    description: "Set sponsorship amount and options",
  },
];

const SponsorDashboardPage = () => {
  const {
    data: walletData,
    isLoading: isLoadingWallet,
    isError: isErrorWallet,
    error: errorWallet,
  } = useGetSponsorWaasWalletQuery();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const { activeStep, setActiveStep, goToNext, goToPrevious } = useSteps({
    index: 0,
    count: steps.length,
  });

  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>(""); // Store beneficiary phone number
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sponsorshipAmount, setSponsorshipAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>(""); // New state for notes
  const [expiresAt, setExpiresAt] = useState<string>(""); // New state for expires_at
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const {
    data: beneficiaries,
    isLoading: isLoadingBeneficiaries,
    isError: isErrorBeneficiaries,
  } = useGetSponsorBeneficiariesQuery();
  const {
    data: categories,
    isLoading: isLoadingCategories,
    isError: isErrorCategories,
  } = useGetCategoriesQuery();

  const createSponsorshipMutation = useCreateSponsorshipMutation();

  const handleNext = () => {
    setFormErrors({});
    if (activeStep === 0) {
      // Validate beneficiary selection
      if (!selectedBeneficiary) {
        setFormErrors({ beneficiary: "Please select a beneficiary." });
        return;
      }
    } else if (activeStep === 1) {
      // Validate category selection
      if (selectedCategories.length === 0) {
        setFormErrors({ categories: "Please select at least one category." });
        return;
      }
    } else if (activeStep === 2) {
      // Validate amount
      if (sponsorshipAmount <= 0) {
        setFormErrors({
          amount: "Sponsorship amount must be greater than zero.",
        });
        return;
      }
    }
    goToNext();
  };

  const resetForm = () => {
    setSelectedBeneficiary("");
    setSelectedCategories([]);
    setSponsorshipAmount(0);
    setNotes(""); // Reset notes
    setExpiresAt(""); // Reset expires_at
    setFormErrors({});
    setActiveStep(0);
  };

  const handleCloseModal = () => {
    resetForm();
    onClose();
  };

  const handleCreateSponsorship = async () => {
    if (sponsorshipAmount <= 0) {
      setFormErrors({
        amount: "Sponsorship amount must be greater than zero.",
      });
      toast({
        title: "Validation Error",
        description: "Sponsorship amount must be greater than zero.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (!selectedBeneficiary) {
      // Should be caught by step validation but good to double check
      toast({
        title: "Error",
        description: "Beneficiary not selected.",
        status: "error",
      });
      return;
    }
    if (selectedCategories.length === 0) {
      // Same for categories
      toast({
        title: "Error",
        description: "No categories selected.",
        status: "error",
      });
      return;
    }

    const payload: CreateSponsorshipPayload = {
      beneficiary_phone_number: selectedBeneficiary,
      amount_usdc: sponsorshipAmount,
      category_ids: selectedCategories,
    };

    if (notes.trim() !== "") {
      payload.notes = notes.trim();
    }
    if (expiresAt.trim() !== "") {
      // Convert datetime-local string to a format that new Date() can reliably parse,
      // or ensure it's directly compatible. `YYYY-MM-DDTHH:MM` is generally fine.
      payload.expires_at = expiresAt;
    }

    createSponsorshipMutation.mutate(payload, {
      onSuccess: (data) => {
        toast({
          title: "Sponsorship Created!",
          description: `Successfully created sponsorship for ${
            data.beneficiary.display_name ||
            data.beneficiary.phone_number_for_telegram
          } with ${data.total_allocated_usdc} USDC.`,
          status: "success",
          duration: 7000,
          isClosable: true,
        });
        handleCloseModal();
      },
      onError: (error: Error) => {
        let errorMessage = "Failed to create sponsorship.";
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          errorMessage =
            axiosError.response?.data?.error ||
            axiosError.message ||
            errorMessage;
        } else {
          errorMessage = error.message || errorMessage;
        }
        toast({
          title: "Creation Failed",
          description: errorMessage,
          status: "error",
          duration: 7000,
          isClosable: true,
        });
      },
    });
  };

  const getOnrampUrl = (walletAddress: string) => {
    const params = new URLSearchParams({
      appId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID || "",
      addresses: JSON.stringify({
        [walletAddress]: ["base"],
      }),
      assets: JSON.stringify(["USDC"]),
      defaultNetwork: "base",
    });
    return `https://pay.coinbase.com/buy/select-asset?${params.toString()}`;
  };

  return (
    <Box p={6}>
      <HStack justifyContent="space-between" mb={6}>
        <Heading as="h1" size="xl">
          Sponsor Dashboard
        </Heading>
        <Button
          colorScheme="brand"
          onClick={onOpen}
          isLoading={createSponsorshipMutation.isPending}
        >
          Create Sponsorship
        </Button>
      </HStack>

      <Box mb={6}>
        <Heading as="h2" size="lg" mb={3}>
          Your WaaS Wallet
        </Heading>
        {isLoadingWallet && (
          <Box display="flex" alignItems="center">
            <Spinner size="md" mr={3} />
            <Text>Loading wallet information...</Text>
          </Box>
        )}
        {isErrorWallet && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Error fetching wallet!</AlertTitle>
              <AlertDescription display="block">
                {errorWallet?.message || "An unexpected error occurred."}
              </AlertDescription>
            </Box>
          </Alert>
        )}
        {walletData && !isLoadingWallet && !isErrorWallet && (
          <Box p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
            <Text fontSize="lg" fontWeight="medium">
              USDC Balance:
              <Text as="span" fontWeight="bold" color="green.500" ml={2}>
                {walletData.usdc_balance.toLocaleString(undefined, {
                  style: "currency",
                  currency: "USD",
                })}
              </Text>
            </Text>
            <Text mt={2} color="gray.600">
              Wallet Address:{" "}
              <Code colorScheme="gray">{walletData.wallet_address}</Code>
            </Text>
            <Text mt={1} color="gray.500" fontSize="sm">
              Last updated:{" "}
              {new Date(walletData.last_balance_sync_at).toLocaleString()}
            </Text>
            <Text mt={1} color="gray.600">
              Gas Balance (ETH/Native):{" "}
              <Text as="span" fontWeight="bold">
                {walletData.gas_balance}
              </Text>
            </Text>
            <Divider my={4} />
            <Box bg="blue.50" p={4} borderRadius="md">
              <Text fontSize="lg" fontWeight="semibold" mb={3}>
                Add Funds to Your Wallet
              </Text>
              <Text mb={4} color="gray.600">
                Add USDC to your wallet using credit card, bank transfer, or
                your Coinbase account.
              </Text>
              <FundButton
                text="Add USDC via Coinbase"
                openIn="popup"
                fundingUrl={getOnrampUrl(walletData.wallet_address)}
              />
            </Box>
          </Box>
        )}
        {!walletData && !isLoadingWallet && !isErrorWallet && (
          <Text>No WaaS wallet information available at the moment.</Text>
        )}
      </Box>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Sponsorship</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Stepper
              index={activeStep}
              colorScheme="brand"
              mb={6}
              orientation="horizontal"
            >
              {steps.map((step, index) => (
                <Step
                  key={index}
                  onClick={() => setActiveStep(index)}
                  style={{ cursor: "pointer" }}
                >
                  <StepIndicator>
                    <StepStatus
                      complete={<StepIcon />}
                      incomplete={<StepNumber />}
                      active={<StepNumber />}
                    />
                  </StepIndicator>
                  <Box flexShrink="0">
                    <StepTitle>{step.title}</StepTitle>
                    <StepDescription>{step.description}</StepDescription>
                  </Box>
                  <StepSeparator />
                </Step>
              ))}
            </Stepper>

            {activeStep === 0 && (
              <FormControl isInvalid={!!formErrors.beneficiary} isRequired>
                <FormLabel>Select Beneficiary</FormLabel>
                {isLoadingBeneficiaries && <Spinner />}
                {isErrorBeneficiaries && (
                  <Text color="red.500">Error loading beneficiaries.</Text>
                )}
                {beneficiaries && (
                  <Select
                    placeholder="Choose a beneficiary"
                    value={selectedBeneficiary}
                    onChange={(e) => setSelectedBeneficiary(e.target.value)}
                  >
                    {beneficiaries.map((b: Beneficiary) => (
                      <option key={b.id} value={b.phone_number_for_telegram}>
                        {b.display_name || b.phone_number_for_telegram}
                      </option>
                    ))}
                  </Select>
                )}
                {formErrors.beneficiary && (
                  <FormErrorMessage>{formErrors.beneficiary}</FormErrorMessage>
                )}
              </FormControl>
            )}

            {activeStep === 1 && (
              <FormControl isInvalid={!!formErrors.categories} isRequired>
                <FormLabel>Select Categories (at least one)</FormLabel>
                {isLoadingCategories && <Spinner />}
                {isErrorCategories && (
                  <Text color="red.500">Error loading categories.</Text>
                )}
                {categories && (
                  <CheckboxGroup
                    value={selectedCategories}
                    onChange={(values) =>
                      setSelectedCategories(values as string[])
                    }
                  >
                    <VStack spacing={2} alignItems="flex-start">
                      {categories.map((c: Category) => (
                        <Checkbox key={c.id} value={c.id}>
                          {c.name}{" "}
                          {c.description && (
                            <Text as="span" fontSize="sm" color="gray.500">
                              ({c.description})
                            </Text>
                          )}
                        </Checkbox>
                      ))}
                    </VStack>
                  </CheckboxGroup>
                )}
                {formErrors.categories && (
                  <FormErrorMessage>{formErrors.categories}</FormErrorMessage>
                )}
              </FormControl>
            )}

            {activeStep === 2 && (
              <VStack spacing={4} align="stretch">
                <FormControl isInvalid={!!formErrors.amount} isRequired>
                  <FormLabel>Sponsorship Amount (USDC)</FormLabel>
                  <NumberInput
                    min={0.01}
                    precision={2}
                    value={sponsorshipAmount}
                    onChange={(valueString) =>
                      setSponsorshipAmount(parseFloat(valueString) || 0)
                    }
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  {formErrors.amount && (
                    <FormErrorMessage>{formErrors.amount}</FormErrorMessage>
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes for this sponsorship (e.g., purpose, conditions)"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Expires At (Optional)</FormLabel>
                  <Input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    If set, the sponsorship will automatically expire after this
                    date and time.
                  </Text>
                </FormControl>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              mr={3}
              onClick={goToPrevious}
              isDisabled={
                activeStep === 0 || createSponsorshipMutation.isPending
              }
            >
              Previous
            </Button>
            {activeStep < steps.length - 1 && (
              <Button
                colorScheme="brand"
                onClick={handleNext}
                isLoading={createSponsorshipMutation.isPending}
              >
                Next
              </Button>
            )}
            {activeStep === steps.length - 1 && (
              <Button
                colorScheme="brand"
                onClick={handleCreateSponsorship}
                isLoading={createSponsorshipMutation.isPending}
              >
                Create Sponsorship
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SponsorDashboardPage;
