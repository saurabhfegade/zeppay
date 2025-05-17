import { NextPage } from "next";
import { useGetSponsorBeneficiariesQuery } from "@/frontend/hooks/queries/use-get-sponsor-beneficiaries-query";
import { useAddSponsorBeneficiaryMutation } from "@/frontend/hooks/mutations/use-add-sponsor-beneficiary-mutation";
import { AddSponsorBeneficiaryPayload } from "@/backend/validation/beneficiary-validation";
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  CloseButton,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addSponsorBeneficiarySchema } from "@/backend/validation/beneficiary-validation"; // For client-side validation
import { AxiosError } from "axios"; // For error typing

// Interface for API error structure, mirrors the one in the mutation hook
interface ApiErrorResponse {
  message?: string;
  errors?: {
    fieldErrors?: Record<string, string[] | undefined>;
    formErrors?: string[];
  };
}

const SponsorBeneficiariesPage: NextPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const {
    data: beneficiaries,
    isLoading,
    isError,
    error: queryError,
  } = useGetSponsorBeneficiariesQuery();

  const addBeneficiaryMutation = useAddSponsorBeneficiaryMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddSponsorBeneficiaryPayload>({
    resolver: zodResolver(addSponsorBeneficiarySchema),
  });

  const onSubmit: SubmitHandler<AddSponsorBeneficiaryPayload> = async (
    data: AddSponsorBeneficiaryPayload,
  ) => {
    try {
      await addBeneficiaryMutation.mutateAsync(data);
      toast({
        title: "Beneficiary added.",
        description:
          "The new beneficiary has been successfully added to your list.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      reset();
      onClose();
    } catch (error) {
      // Typed error
      const err = error as AxiosError<ApiErrorResponse>;
      const apiErrorMessage =
        err.response?.data?.message || "Failed to add beneficiary.";
      const formErrors = err.response?.data?.errors?.fieldErrors;
      toast({
        title: "Error adding beneficiary.",
        description: apiErrorMessage,
        status: "error",
        duration: 7000,
        isClosable: true,
      });
      if (formErrors) {
        Object.keys(formErrors).forEach((key) => {
          console.error(
            `Form error for ${key}: ${formErrors[
              key as keyof typeof formErrors
            ]?.join(", ")}`,
          );
        });
      }
    }
  };

  return (
    <>
      <Box py={8} px={{ base: 4, md: 8 }}>
        <VStack spacing={6} align="stretch">
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Heading as="h1" size="xl">
              My Beneficiaries
            </Heading>
            <Button colorScheme="brand" onClick={onOpen}>
              Add New Beneficiary
            </Button>
          </Box>

          {isLoading && (
            <Box display="flex" justifyContent="center" py={10}>
              <Spinner size="xl" />
            </Box>
          )}
          {isError && queryError && (
            <Alert status="error">
              <AlertIcon />
              <AlertTitle>Error loading beneficiaries!</AlertTitle>
              <AlertDescription>
                {queryError.message || "Could not fetch your beneficiaries."}
              </AlertDescription>
            </Alert>
          )}
          {!isLoading && !isError && beneficiaries && (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Display Name</Th>
                    <Th>Phone Number (Telegram)</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {beneficiaries.length === 0 && (
                    <Tr>
                      <Td colSpan={2} textAlign="center">
                        You haven&apos;t added any beneficiaries yet.
                      </Td>
                    </Tr>
                  )}
                  {beneficiaries.map((beneficiary) => (
                    <Tr key={beneficiary.id}>
                      <Td>{beneficiary.display_name || "N/A"}</Td>
                      <Td>{beneficiary.phone_number_for_telegram}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </VStack>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Beneficiary</ModalHeader>
          <CloseButton
            position="absolute"
            right="8px"
            top="8px"
            onClick={onClose}
          />
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.display_name}>
                  <FormLabel htmlFor="display_name">Display Name</FormLabel>
                  <Input
                    id="display_name"
                    placeholder="Enter beneficiary's name"
                    {...register("display_name")}
                  />
                  <FormErrorMessage>
                    {errors.display_name && errors.display_name.message}
                  </FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.phone_number_for_telegram}>
                  <FormLabel htmlFor="phone_number_for_telegram">
                    Phone Number (for Telegram)
                  </FormLabel>
                  <Input
                    id="phone_number_for_telegram"
                    type="tel"
                    placeholder="+12345678900 (E.164 format)"
                    {...register("phone_number_for_telegram")}
                  />
                  <FormErrorMessage>
                    {errors.phone_number_for_telegram &&
                      errors.phone_number_for_telegram.message}
                  </FormErrorMessage>
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button onClick={onClose} mr={3} variant="ghost">
                Cancel
              </Button>
              <Button
                colorScheme="brand"
                type="submit"
                isLoading={addBeneficiaryMutation.isPending || isSubmitting}
              >
                Add Beneficiary
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SponsorBeneficiariesPage;
