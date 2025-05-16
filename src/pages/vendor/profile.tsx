import { NextPage } from 'next';
import { 
  Box, 
  Heading, 
  Text, 
  VStack, 
  Spinner, 
  Alert, 
  AlertIcon, 
  FormControl, 
  FormLabel, 
  RadioGroup,
  Radio,
  Stack, 
  Button, 
  useToast 
} from '@chakra-ui/react';
import { useGetCategoriesQuery } from '@/frontend/hooks/queries/use-get-categories-query';
import { useGetVendorCategoriesQuery } from '@/frontend/hooks/queries/use-get-vendor-categories-query';
import { useUpdateVendorCategoriesMutation } from '@/frontend/hooks/mutations/use-update-vendor-categories-mutation';
import { useVendorProfileStore } from '@/frontend/store/vendor-profile-store';
import { useAuthStore } from '@/frontend/store/auth-store';
import { useEffect, useState } from 'react';

const VendorProfilePage: NextPage = () => {
  const toast = useToast();
  const { data: allCategories, isLoading: isLoadingAllCategories, error: errorAllCategories } = useGetCategoriesQuery();
  const { isLoading: isLoadingVendorCategories, error: errorVendorCategories } = useGetVendorCategoriesQuery();
  const assignedCategoriesFromStore = useVendorProfileStore((state) => state.assignedCategories);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const updateCategoriesMutation = useUpdateVendorCategoriesMutation();

  const currentUser = useAuthStore((state) => state.user);
  const isLoadingUser = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (assignedCategoriesFromStore && assignedCategoriesFromStore.length > 0) {
      setSelectedCategoryId(assignedCategoriesFromStore[0].id);
    } else {
      setSelectedCategoryId(null);
    }
  }, [assignedCategoriesFromStore]);

  const handleSubmit = async () => {
    if (!selectedCategoryId) {
      toast({
        title: 'No category selected',
        description: 'Please select one category.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    updateCategoriesMutation.mutate(
      { category_ids: [selectedCategoryId] },
      {
        onSuccess: (data) => {
          toast({
            title: 'Category updated',
            description: data.message || 'Your category has been successfully updated.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        },
        onError: (error) => {
          toast({
            title: 'Update failed',
            description: error.message || 'Could not update category. Please try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        },
      }
    );
  };

  if (isLoadingAllCategories || isLoadingVendorCategories || isLoadingUser) {
    return (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" />
        </Box>
    );
  }

  if (errorAllCategories || errorVendorCategories) {
    return (
        <Alert status="error">
          <AlertIcon />
          There was an error loading category data. Please try again later.
          {errorAllCategories && <Text fontSize="sm">{errorAllCategories.message}</Text>}
          {errorVendorCategories && <Text fontSize="sm">{errorVendorCategories.message}</Text>}
        </Alert>
    );
  }

  if (!currentUser) {
    return (
      <Alert status="warning">
        <AlertIcon />
        User not found. Please log in again.
      </Alert>
    );
  }

  return (
      <Box p={8}>
        <VStack spacing={6} align="stretch">
          <Heading as="h1" size="xl">Vendor Profile</Heading>
          
          <Box p={6} borderWidth="1px" borderRadius="lg" shadow="md">
            <Heading as="h2" size="lg" mb={4}>Your Details</Heading>
            <VStack align="start" spacing={3}>
              <Text><strong>Email:</strong> {currentUser.email}</Text>
              <Text><strong>User ID:</strong> {currentUser.id}</Text>
              <Text><strong>Role:</strong> {currentUser.role || 'N/A'}</Text>
              <Text><strong>Display Name:</strong> {currentUser.display_name || currentUser.email}</Text>
            </VStack>
          </Box>

          <Box p={6} borderWidth="1px" borderRadius="lg" shadow="md">
            <Heading as="h2" size="lg" mb={4}>Manage Your Category</Heading>
            {assignedCategoriesFromStore && assignedCategoriesFromStore.length > 0 && (
              <Alert status="info" mb={4}>
                <AlertIcon />
                {`Your current category is "${assignedCategoriesFromStore[0].name}". You can change it below.`}
              </Alert>
            )}
            {(!assignedCategoriesFromStore || assignedCategoriesFromStore.length === 0) && (
              <Alert status="warning" mb={4}>
                <AlertIcon />
                Please select the category your business operates in.
              </Alert>
            )}

            {allCategories && allCategories.length > 0 ? (
              <FormControl>
                <FormLabel>Select a category:</FormLabel>
                <RadioGroup
                  value={selectedCategoryId || ''}
                  onChange={(value: string) => setSelectedCategoryId(value)}
                >
                  <Stack spacing={3} direction={['column']} >
                    {allCategories.map(category => (
                      <Radio key={category.id} value={category.id}>
                        {category.name}
                      </Radio>
                    ))}
                  </Stack>
                </RadioGroup>
                <Button
                  mt={6}
                  colorScheme="blue"
                  onClick={handleSubmit}
                  isLoading={updateCategoriesMutation.isPending}
                  disabled={!selectedCategoryId}
                >
                  {assignedCategoriesFromStore && assignedCategoriesFromStore.length > 0 ? 'Update Category' : 'Save Category'}
                </Button>
              </FormControl>
            ) : (
              <Text>No categories available to select. Please contact support.</Text>
            )}
          </Box>
        </VStack>
      </Box>
  );
};

export default VendorProfilePage; 