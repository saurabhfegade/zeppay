import { NextPage } from 'next';
import Link from 'next/link';
import { useVendorProfileStore } from '@/frontend/store/vendor-profile-store';
import { useGetVendorCategoriesQuery } from '@/frontend/hooks/queries/use-get-vendor-categories-query';
import { useGetEligibleSponsorshipsQuery } from '@/frontend/hooks/queries/use-get-eligible-sponsorships-query';
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
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
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Tag
} from '@chakra-ui/react';
import { useState } from 'react';

const paymentSteps = [
  { title: 'Select Beneficiary', description: 'Select Beneficiary' },
  { title: 'Enter Amount', description: 'Specify payment details' },
];

interface SelectedSponsorshipDetails {
  sponsorshipId: string;
  beneficiaryName: string;
  beneficiaryId: string;
  sponsorshipAllowedCategoryId: string;
  categoryId: string;
  categoryName: string;
  maxAmount: number;
}

const VendorDashboardPage: NextPage = () => {
  const { isLoading: isLoadingVendorOwnCategories, error: errorVendorOwnCategories } = useGetVendorCategoriesQuery();
  const assignedCategories = useVendorProfileStore((state) => state.assignedCategories);
  const categoriesExist = assignedCategories.length > 0;
  const toast = useToast();

  // State for "Accept Payment" Modal
  const { isOpen: isPaymentModalOpen, onOpen: onPaymentModalOpen, onClose: onPaymentModalClose } = useDisclosure();
  const { activeStep: paymentActiveStep, setActiveStep: setPaymentActiveStep, goToNext: goToPaymentNext, goToPrevious: goToPaymentPrevious } = useSteps({
    index: 0,
    count: paymentSteps.length,
  });

  const { data: eligibleSponsorships, isLoading: isLoadingEligibleSponsorships, error: errorEligibleSponsorships } = useGetEligibleSponsorshipsQuery();

  const [selectedSponsorshipAllocation, setSelectedSponsorshipAllocation] = useState<SelectedSponsorshipDetails | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentFormErrors, setPaymentFormErrors] = useState<{ [key: string]: string }>({});

  const handleOpenPaymentModal = () => {
    if (!categoriesExist) {
        toast({ title: 'Profile Incomplete', description: 'Please assign a category to your business first.', status: 'warning', duration: 5000, isClosable: true });
        return;
    }
    // Reset form states before opening
    setSelectedSponsorshipAllocation(null);
    setPaymentAmount(0);
    setPaymentNotes('');
    setPaymentFormErrors({});
    setPaymentActiveStep(0);
    onPaymentModalOpen();
  };

  const handlePaymentNext = () => {
    setPaymentFormErrors({});
    if (paymentActiveStep === 0) { 
      if (!selectedSponsorshipAllocation) {
        setPaymentFormErrors({ sponsorship: 'Please select a sponsorship allocation.' });
        return;
      }
    } else if (paymentActiveStep === 1) { 
        if (paymentAmount <= 0) {
            setPaymentFormErrors({ amount: 'Payment amount must be greater than zero.' });
            return;
        }
        if (selectedSponsorshipAllocation && paymentAmount > selectedSponsorshipAllocation.maxAmount) {
            setPaymentFormErrors({ amount: `Amount cannot exceed available ${selectedSponsorshipAllocation.maxAmount.toFixed(2)} USDC.` });
            return;
        }
    }
    goToPaymentNext();
  };

  const handleAcceptPayment = async () => {
    // Basic validation, similar to handlePaymentNext for the final step
    if (!selectedSponsorshipAllocation) {
        toast({ title: 'Error', description: 'No sponsorship selected.', status: 'error' }); return;
    }
    if (paymentAmount <= 0) {
        toast({ title: 'Error', description: 'Payment amount must be > 0.', status: 'error' }); return;
    }
    if (paymentAmount > selectedSponsorshipAllocation.maxAmount) {
        toast({ title: 'Error', description: `Amount exceeds available ${selectedSponsorshipAllocation.maxAmount.toFixed(2)} USDC.`, status: 'error' }); return;
    }

    // TODO: Implement actual payment mutation call here
    console.log('Processing payment:', {
        sponsorshipId: selectedSponsorshipAllocation.sponsorshipId,
        beneficiaryId: selectedSponsorshipAllocation.beneficiaryId,
        sponsorshipAllowedCategoryId: selectedSponsorshipAllocation.sponsorshipAllowedCategoryId,
        categoryId: selectedSponsorshipAllocation.categoryId,
        amount: paymentAmount,
        notes: paymentNotes,
    });
    toast({ title: 'Payment initiated (Simulation)', description: `Requesting ${paymentAmount} USDC from ${selectedSponsorshipAllocation.beneficiaryName} for ${selectedSponsorshipAllocation.categoryName}.`, status: 'info', duration: 7000, isClosable: true });
    onPaymentModalClose(); // Close after (simulated) success
  };
  
  const isLoading = isLoadingVendorOwnCategories || isLoadingEligibleSponsorships;
  const pageError = errorVendorOwnCategories || errorEligibleSponsorships;

  return (
      <Box p={8}>
        <VStack spacing={6} align="stretch">
            <HStack justifyContent="space-between" alignItems="center">
                <Heading as="h1" size="xl">Vendor Dashboard</Heading>
                <Button colorScheme="green" onClick={handleOpenPaymentModal} isDisabled={!categoriesExist || isLoading}>
                    Accept Payment
                </Button>
            </HStack>

          {isLoading && (
            <Box display="flex" justifyContent="center" alignItems="center" height="100px">
              <Spinner size="lg" />
              <Text ml={3}>Loading your details...</Text>
            </Box>
          )}

          {pageError && (
            <Alert status="error">
              <AlertIcon />
              <AlertTitle>Error loading your information!</AlertTitle>
              <AlertDescription>{pageError.message}</AlertDescription>
            </Alert>
          )}
          
          {!isLoading && !pageError && !categoriesExist && (
             <Alert status='warning' variant='subtle' flexDirection='column' alignItems='center' justifyContent='center' textAlign='center' p={4} borderRadius="md">
              <AlertIcon boxSize='40px' mr={0} />
              <AlertTitle mt={4} mb={1} fontSize='lg'>Action Required: Set Your Business Category</AlertTitle>
              <AlertDescription maxWidth='sm'>To start receiving payments, please assign a category to your business.</AlertDescription>
              <Link href="/vendor/profile" passHref><Button as="a" colorScheme="yellow" mt={4}>Go to Profile to Assign Category</Button></Link>
            </Alert>
          )}

          {categoriesExist && (
            <Alert status="success" mb={6}>
              <AlertIcon />
              <AlertTitle>Profile Complete!</AlertTitle>
              <AlertDescription>
                Your business categories are set. You are ready to receive payments.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Accept Payment Modal */}
          <Modal isOpen={isPaymentModalOpen} onClose={onPaymentModalClose} size="4xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Accept Payment</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <Stepper index={paymentActiveStep} colorScheme="green" mb={6} orientation="horizontal">
                  {paymentSteps.map((step, index) => (
                    <Step key={index} onClick={() => setPaymentActiveStep(index)} style={{cursor: 'pointer'}}>
                      <StepIndicator><StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} /></StepIndicator>
                      <Box flexShrink='0'><StepTitle>{step.title}</StepTitle><StepDescription>{step.description}</StepDescription></Box>
                      <StepSeparator />
                    </Step>
                  ))}
                </Stepper>

                {paymentActiveStep === 0 && (
                  <FormControl isInvalid={!!paymentFormErrors.sponsorship} isRequired>
                    <FormLabel>Select Sponsorship Allocation</FormLabel>
                    {isLoadingEligibleSponsorships && <Spinner />}
                    {errorEligibleSponsorships && <Text color="red.500">Error loading sponsorships: {errorEligibleSponsorships.message}</Text>}
                    {eligibleSponsorships && eligibleSponsorships.length === 0 && <Text>No eligible sponsorships found for your categories.</Text>}
                    {eligibleSponsorships && eligibleSponsorships.length > 0 && (
                        <TableContainer>
                            <Table variant="simple" size="sm">
                                <Thead>
                                    <Tr><Th>Beneficiary</Th><Th>Category</Th><Th textAlign="center">Available (USDC)</Th><Th>Action</Th></Tr>
                                </Thead>
                                <Tbody>
                                    {eligibleSponsorships.flatMap(sp => 
                                        sp.eligible_allocations.map(alloc => (
                                            <Tr 
                                                key={`${sp.sponsorship_id}-${alloc.sponsorship_allowed_category_id}`} 
                                                bg={selectedSponsorshipAllocation?.sponsorshipId === sp.sponsorship_id && selectedSponsorshipAllocation?.sponsorshipAllowedCategoryId === alloc.sponsorship_allowed_category_id ? "green.100" : "transparent"}
                                            >
                                                <Td>{sp.beneficiary.display_name || sp.beneficiary.phone_number_for_telegram}</Td>
                                                <Td><Tag colorScheme='blue'>{alloc.category_name}</Tag></Td>
                                                <Td textAlign="center">{alloc.available_usdc.toFixed(2)}</Td>
                                                <Td>
                                                    <Button 
                                                        size="xs" 
                                                        colorScheme="green" 
                                                        variant={selectedSponsorshipAllocation?.sponsorshipId === sp.sponsorship_id && selectedSponsorshipAllocation?.sponsorshipAllowedCategoryId === alloc.sponsorship_allowed_category_id ? "solid" : "outline"} 
                                                        onClick={() => setSelectedSponsorshipAllocation({
                                                            sponsorshipId: sp.sponsorship_id,
                                                            beneficiaryName: sp.beneficiary.display_name || sp.beneficiary.phone_number_for_telegram || 'Unknown Beneficiary',
                                                            beneficiaryId: sp.beneficiary.id,
                                                            sponsorshipAllowedCategoryId: alloc.sponsorship_allowed_category_id,
                                                            categoryId: alloc.category_id,
                                                            categoryName: alloc.category_name,
                                                            maxAmount: alloc.available_usdc
                                                        })}>
                                                        Select
                                                    </Button>
                                                </Td>
                                            </Tr>
                                        ))
                                    )}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    )}
                    {paymentFormErrors.sponsorship && <FormErrorMessage>{paymentFormErrors.sponsorship}</FormErrorMessage>}
                  </FormControl>
                )}

                {paymentActiveStep === 1 && selectedSponsorshipAllocation && (
                  <VStack spacing={4} align="stretch">
                    <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
                        <Text><strong>Beneficiary:</strong> {selectedSponsorshipAllocation.beneficiaryName}</Text>
                        <Text><strong>Category:</strong> <Tag colorScheme='blue'>{selectedSponsorshipAllocation.categoryName}</Tag></Text>
                        <Text><strong>Available for this category:</strong> {selectedSponsorshipAllocation.maxAmount.toFixed(2)} USDC</Text>
                    </Box>
                    <FormControl isInvalid={!!paymentFormErrors.amount} isRequired>
                      <FormLabel>Payment Amount (USDC)</FormLabel>
                      <NumberInput 
                          min={0.01} 
                          max={selectedSponsorshipAllocation.maxAmount}
                          precision={2} 
                          value={paymentAmount}
                          onChange={(valueString) => setPaymentAmount(parseFloat(valueString) || 0)}
                      >
                        <NumberInputField />
                        <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                      </NumberInput>
                      {paymentFormErrors.amount && <FormErrorMessage>{paymentFormErrors.amount}</FormErrorMessage>}
                    </FormControl>
                    <FormControl>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <Textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Notes for this transaction" />
                    </FormControl>
                  </VStack>
                )}
              </ModalBody>
              <ModalFooter>
                <Button mr={3} onClick={goToPaymentPrevious} isDisabled={paymentActiveStep === 0}>
                  Previous
                </Button>
                {paymentActiveStep < paymentSteps.length - 1 && (
                  <Button colorScheme="teal" onClick={handlePaymentNext} isDisabled={!selectedSponsorshipAllocation}>
                    Next
                  </Button>
                )}
                {paymentActiveStep === paymentSteps.length - 1 && (
                  <Button colorScheme="green" onClick={handleAcceptPayment} isDisabled={!selectedSponsorshipAllocation || paymentAmount <= 0 || paymentAmount > (selectedSponsorshipAllocation?.maxAmount || 0)}>
                    Accept Payment (Simulate)
                  </Button>
                )}
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* Placeholder for other dashboard content - existing content starts here */} 
          {!isLoading && !pageError && categoriesExist && (
             <Box mt={0} p={6} borderWidth="1px" borderRadius="lg" shadow="md">
              <Heading as="h2" size="lg" mb={4}>Your Assigned Categories</Heading>
              <VStack align="start">
                {assignedCategories.map(cat => <Text key={cat.id}>- {cat.name}</Text>)}
              </VStack>
              <Link href="/vendor/profile" passHref><Button as="a" colorScheme="gray" mt={4} size="sm">Manage Categories</Button></Link>
            </Box>
          )}
          
          <Box mt={6} p={6} borderWidth="1px" borderRadius="lg" shadow="md">
            <Heading as="h2" size="lg" mb={4}>Recent Transactions (Placeholder)</Heading>
            <Text>Transaction data will appear here.</Text>
          </Box>

          <Box mt={6} p={6} borderWidth="1px" borderRadius="lg" shadow="md">
            <Heading as="h2" size="lg" mb={4}>Account Overview (Placeholder)</Heading>
            <Text>Key account metrics will be displayed here.</Text>
          </Box>
        </VStack>
      </Box>
  );
};

export default VendorDashboardPage; 