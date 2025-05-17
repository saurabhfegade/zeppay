import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
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
  Box,
  FormControl,
  FormLabel,
  FormErrorMessage,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  useToast,
  VStack,
  HStack,
  Text,
  Spinner,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Tag,
  PinInput,
  PinInputField,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { SelectedSponsorshipDetails } from "@/pages/vendor/dashboard"; // Assuming this is exported
import apiClient from "@/frontend/lib/axios-client";

interface ApiErrorData {
  error: string;
  details?: unknown;
}

// Types for API payloads and responses (mirroring backend expectations)
interface InitiatePaymentPayload {
  beneficiary_phone_number: string;
  amount_usdc: number;
  category_id: string;
  vendor_notes?: string;
}

interface InitiatePaymentResponse {
  pending_transaction_id: string;
  otp_message_to_display: string; // Message from backend to guide user or for alert
  otp_expires_at: string;
  otp?: string; // OTP might be returned for testing/dev purposes
}

interface ConfirmPaymentPayload {
  pending_transaction_id: string;
  otp: string;
}

interface ConfirmPaymentResponse {
  message: string;
  transaction: Record<string, unknown>; // Using Record<string, unknown> for now
}

// Prop types for the modal
// Assuming EligibleSponsorship type structure from your queries
interface EligibleAllocation {
  sponsorship_allowed_category_id: string;
  category_id: string;
  category_name: string;
  available_usdc: number;
}
interface Beneficiary {
  id: string;
  display_name?: string | null;
  phone_number_for_telegram?: string | null;
}
interface EligibleSponsorship {
  sponsorship_id: string;
  beneficiary: Beneficiary;
  eligible_allocations: EligibleAllocation[];
}

interface AcceptPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  eligibleSponsorships: EligibleSponsorship[];
  isLoadingEligibleSponsorships: boolean;
  errorEligibleSponsorships: Error | { message: string } | null;
}

const paymentStepsConfig = [
  { title: "Select Beneficiary", description: "Choose beneficiary & category" },
  { title: "Enter Amount", description: "Specify payment details" },
  { title: "Verify OTP", description: "Enter OTP from beneficiary" },
];

export const AcceptPaymentModal: React.FC<AcceptPaymentModalProps> = ({
  isOpen,
  onClose,
  eligibleSponsorships,
  isLoadingEligibleSponsorships,
  errorEligibleSponsorships,
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { activeStep, setActiveStep, goToNext, goToPrevious } = useSteps({
    index: 0,
    count: paymentStepsConfig.length,
  });

  const [selectedSponsorship, setSelectedSponsorship] =
    useState<SelectedSponsorshipDetails | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [pendingTransactionId, setPendingTransactionId] = useState<
    string | null
  >(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Reset state when modal is closed or opened
  useEffect(() => {
    if (isOpen) {
      setActiveStep(0);
      setSelectedSponsorship(null);
      setPaymentAmount(0);
      setPaymentNotes("");
      setOtp("");
      setPendingTransactionId(null);
      setFormErrors({});
    }
  }, [isOpen, setActiveStep]);

  const initiateMutationOptions: UseMutationOptions<
    InitiatePaymentResponse,
    AxiosError<ApiErrorData>,
    InitiatePaymentPayload
  > = {
    mutationFn: async (payload: InitiatePaymentPayload) => {
      const response = await apiClient.post(
        "/vendors/transactions/initiate",
        payload,
      );
      return response.data;
    },
    onSuccess: (data: InitiatePaymentResponse) => {
      setPendingTransactionId(data.pending_transaction_id);
      toast({
        title: "OTP Sent!",
        description:
          data.otp_message_to_display ||
          "An OTP has been sent to the beneficiary.",
        status: "info",
        duration: 7000,
        isClosable: true,
      });
      if (data.otp) {
        // For testing, if backend sends OTP
        console.log("Test OTP: ", data.otp);
      }
      goToNext();
    },
    onError: (error: AxiosError<ApiErrorData>) => {
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        "Failed to initiate payment.";
      toast({
        title: "Initiation Failed",
        description: errorMsg,
        status: "error",
        duration: 7000,
        isClosable: true,
      });
    },
  };
  const initiateMutation = useMutation(initiateMutationOptions);

  const confirmMutationOptions: UseMutationOptions<
    ConfirmPaymentResponse,
    AxiosError<ApiErrorData>,
    ConfirmPaymentPayload
  > = {
    mutationFn: async (payload: ConfirmPaymentPayload) => {
      const response = await apiClient.post(
        "/vendors/transactions/confirm",
        payload,
      );
      return response.data;
    },
    onSuccess: (data: ConfirmPaymentResponse) => {
      toast({
        title: "Payment Confirmed!",
        description: data.message || "Transaction processed successfully.",
        status: "success",
        duration: 7000,
        isClosable: true,
      });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      onClose();
    },
    onError: (error: AxiosError<ApiErrorData>) => {
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        "Failed to confirm payment.";
      toast({
        title: "Confirmation Failed",
        description: errorMsg,
        status: "error",
        duration: 7000,
        isClosable: true,
      });
    },
  };
  const confirmMutation = useMutation(confirmMutationOptions);

  const handleNextStep = () => {
    setFormErrors({});
    if (activeStep === 0) {
      if (!selectedSponsorship) {
        setFormErrors({
          sponsorship: "Please select a sponsorship allocation.",
        });
        return;
      }
      goToNext();
    } else if (activeStep === 1) {
      // About to initiate payment
      if (!selectedSponsorship) {
        toast({
          title: "Error",
          description: "No sponsorship selected.",
          status: "error",
        });
        return;
      }

      if (!selectedSponsorship.beneficiaryPhoneNumber) {
        toast({
          title: "Error",
          description:
            "Beneficiary phone number is missing or invalid for the selected sponsorship.",
          status: "error",
          duration: 7000,
          isClosable: true,
        });
        setFormErrors({
          sponsorship: "Beneficiary phone number is missing or invalid.",
        });
        return;
      }

      if (paymentAmount <= 0) {
        setFormErrors({ amount: "Payment amount must be greater than zero." });
        return;
      }
      if (paymentAmount > selectedSponsorship.maxAmount) {
        setFormErrors({
          amount: `Amount cannot exceed available ${selectedSponsorship.maxAmount.toFixed(
            2,
          )} USDC.`,
        });
        return;
      }
      // Initiate payment
      initiateMutation.mutate({
        beneficiary_phone_number:
          selectedSponsorship.beneficiaryPhoneNumber as string,
        amount_usdc: paymentAmount,
        category_id: selectedSponsorship.categoryId,
        vendor_notes: paymentNotes || undefined,
      });
    }
    // For step 2 (OTP step), next/submit is handled by handleConfirmPayment
  };

  const handleConfirmPayment = () => {
    if (!pendingTransactionId) {
      toast({
        title: "Error",
        description: "No pending transaction found.",
        status: "error",
      });
      return;
    }
    if (otp.length !== 6) {
      setFormErrors({ otp: "OTP must be 6 digits." });
      return;
    }
    confirmMutation.mutate({
      pending_transaction_id: pendingTransactionId,
      otp: otp,
    });
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Select Beneficiary
        return (
          <FormControl isInvalid={!!formErrors.sponsorship} isRequired>
            <FormLabel>Select Sponsorship Allocation</FormLabel>
            {isLoadingEligibleSponsorships && <Spinner />}
            {errorEligibleSponsorships && (
              <Text color="red.500">
                Error loading sponsorships:{" "}
                {typeof errorEligibleSponsorships === "object" &&
                errorEligibleSponsorships?.message
                  ? errorEligibleSponsorships.message
                  : "Unknown error"}
              </Text>
            )}
            {!isLoadingEligibleSponsorships &&
              eligibleSponsorships.length === 0 && (
                <Text>No eligible sponsorships found for your categories.</Text>
              )}
            {!isLoadingEligibleSponsorships &&
              eligibleSponsorships.length > 0 && (
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Beneficiary</Th>
                        <Th>Category</Th>
                        <Th textAlign="center">Available (USDC)</Th>
                        <Th>Action</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {eligibleSponsorships.flatMap((sp) =>
                        sp.eligible_allocations.map((alloc) => (
                          <Tr
                            key={`${sp.sponsorship_id}-${alloc.sponsorship_allowed_category_id}`}
                            bg={
                              selectedSponsorship?.sponsorshipId ===
                                sp.sponsorship_id &&
                              selectedSponsorship?.sponsorshipAllowedCategoryId ===
                                alloc.sponsorship_allowed_category_id
                                ? "green.100"
                                : "transparent"
                            }
                            _hover={{ bg: "gray.50" }}
                            cursor="pointer"
                            onClick={() =>
                              setSelectedSponsorship({
                                sponsorshipId: sp.sponsorship_id,
                                beneficiaryName:
                                  sp.beneficiary.display_name ||
                                  sp.beneficiary.phone_number_for_telegram ||
                                  "N/A",
                                beneficiaryId: sp.beneficiary.id,
                                beneficiaryPhoneNumber:
                                  sp.beneficiary.phone_number_for_telegram ||
                                  "",
                                sponsorshipAllowedCategoryId:
                                  alloc.sponsorship_allowed_category_id,
                                categoryId: alloc.category_id,
                                categoryName: alloc.category_name,
                                maxAmount: alloc.available_usdc,
                              })
                            }
                          >
                            <Td>
                              {sp.beneficiary.display_name ||
                                sp.beneficiary.phone_number_for_telegram}
                            </Td>
                            <Td>
                              <Tag colorScheme="brand">
                                {alloc.category_name}
                              </Tag>
                            </Td>
                            <Td textAlign="center">
                              {alloc.available_usdc.toFixed(2)}
                            </Td>
                            <Td>
                              <Button
                                size="xs"
                                colorScheme="brand"
                                variant={
                                  selectedSponsorship?.sponsorshipId ===
                                    sp.sponsorship_id &&
                                  selectedSponsorship?.sponsorshipAllowedCategoryId ===
                                    alloc.sponsorship_allowed_category_id
                                    ? "solid"
                                    : "outline"
                                }
                              >
                                {selectedSponsorship?.sponsorshipId ===
                                  sp.sponsorship_id &&
                                selectedSponsorship?.sponsorshipAllowedCategoryId ===
                                  alloc.sponsorship_allowed_category_id
                                  ? "Selected"
                                  : "Select"}
                              </Button>
                            </Td>
                          </Tr>
                        )),
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            {formErrors.sponsorship && (
              <FormErrorMessage>{formErrors.sponsorship}</FormErrorMessage>
            )}
          </FormControl>
        );
      case 1: // Enter Amount
        if (!selectedSponsorship)
          return <Text>Please select a beneficiary first.</Text>;
        return (
          <VStack spacing={4} align="stretch">
            <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
              <Text>
                <strong>Beneficiary:</strong>{" "}
                {selectedSponsorship.beneficiaryName}
              </Text>
              <Text>
                <strong>Category:</strong>{" "}
                <Tag colorScheme="brand">
                  {selectedSponsorship.categoryName}
                </Tag>
              </Text>
              <Text>
                <strong>Available:</strong>{" "}
                {selectedSponsorship.maxAmount.toFixed(2)} USDC
              </Text>
            </Box>
            <FormControl isInvalid={!!formErrors.amount} isRequired>
              <FormLabel>Payment Amount (USDC)</FormLabel>
              <NumberInput
                min={0.01}
                max={selectedSponsorship.maxAmount}
                precision={2}
                value={paymentAmount}
                onChange={(valueString) =>
                  setPaymentAmount(parseFloat(valueString) || 0)
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
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Notes for this transaction"
              />
            </FormControl>
          </VStack>
        );
      case 2: // Verify OTP
        return (
          <VStack spacing={4} align="stretch">
            <Text>
              An OTP has been sent to the beneficiary. Please enter it below to
              confirm the payment.
            </Text>
            <FormControl isInvalid={!!formErrors.otp} isRequired>
              <FormLabel>One-Time Password (OTP)</FormLabel>
              <HStack>
                <PinInput value={otp} onChange={setOtp} otp>
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                </PinInput>
              </HStack>
              {formErrors.otp && (
                <FormErrorMessage>{formErrors.otp}</FormErrorMessage>
              )}
            </FormControl>
          </VStack>
        );
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Accept Payment</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Stepper
            index={activeStep}
            colorScheme="brand"
            mb={6}
            orientation="horizontal"
          >
            {paymentStepsConfig.map((step, index) => (
              <Step
                key={index}
                onClick={() =>
                  !(initiateMutation.isPending || confirmMutation.isPending) &&
                  setActiveStep(index)
                }
                style={{
                  cursor:
                    initiateMutation.isPending || confirmMutation.isPending
                      ? "not-allowed"
                      : "pointer",
                }}
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
          {renderStepContent()}
        </ModalBody>
        <ModalFooter>
          {activeStep > 0 && (
            <Button
              mr={3}
              onClick={goToPrevious}
              isDisabled={
                initiateMutation.isPending || confirmMutation.isPending
              }
            >
              Previous
            </Button>
          )}
          {activeStep < paymentStepsConfig.length - 1 && ( // Next or Initiate button
            <Button
              colorScheme="brand"
              onClick={handleNextStep}
              isDisabled={
                (activeStep === 0 && !selectedSponsorship) ||
                initiateMutation.isPending
              }
              isLoading={initiateMutation.isPending}
            >
              {activeStep === 1 ? "Initiate Payment" : "Next"}
            </Button>
          )}
          {activeStep === paymentStepsConfig.length - 1 && ( // Confirm Payment button
            <Button
              colorScheme="brand"
              onClick={handleConfirmPayment}
              isDisabled={
                otp.length !== 6 ||
                !pendingTransactionId ||
                confirmMutation.isPending
              }
              isLoading={confirmMutation.isPending}
            >
              Confirm Payment
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
