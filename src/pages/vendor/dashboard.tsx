import { NextPage } from 'next';
import Link from 'next/link';
import { useVendorProfileStore } from '@/frontend/store/vendor-profile-store';
import { useGetVendorCategoriesQuery } from '@/frontend/hooks/queries/use-get-vendor-categories-query';
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
} from '@chakra-ui/react';

const VendorDashboardPage: NextPage = () => {
  // Attempt to load vendor categories; this also populates the Zustand store
  const { isLoading, error } = useGetVendorCategoriesQuery();
  // Get assigned categories from the Zustand store as the primary source after initial load
  const assignedCategories = useVendorProfileStore((state) => state.assignedCategories);

  // Determine if categories are definitively set (either from direct fetch or store having items)
  // isLoading is true on first load, once false, either data is there, or error, or empty array.
  const categoriesExist = assignedCategories.length > 0;

  return (
      <Box p={8}>
        <VStack spacing={6} align="stretch">
          <Heading as="h1" size="xl" mb={6}>Vendor Dashboard</Heading>

          {isLoading && (
            <Box display="flex" justifyContent="center" alignItems="center" height="100px">
              <Spinner size="lg" />
              <Text ml={3}>Loading your details...</Text>
            </Box>
          )}

          {error && (
            <Alert status="error">
              <AlertIcon />
              <AlertTitle>Error loading your information!</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          
          {!isLoading && !error && !categoriesExist && (
             <Alert 
              status='warning'
              variant='subtle'
              flexDirection='column'
              alignItems='center'
              justifyContent='center'
              textAlign='center'
              p={4}
              borderRadius="md"
              
            >
              <AlertIcon boxSize='40px' mr={0} />
              <AlertTitle mt={4} mb={1} fontSize='lg'>
                Action Required: Set Your Business Category
              </AlertTitle>
              <AlertDescription maxWidth='sm'>
                To start receiving payments, please assign a category to your business.
              </AlertDescription>
              <Link href="/vendor/profile" passHref>
                <Button as="a" colorScheme="yellow" mt={4}>
                  Go to Profile to Assign Category
                </Button>
              </Link>
            </Alert>
          )}

          {categoriesExist && (
            <Alert status="success">
              <AlertIcon />
              <AlertTitle>Profile Complete!</AlertTitle>
              <AlertDescription>
                Your business categories are set. You are ready to receive payments.
              </AlertDescription>
            </Alert>
          )}

          {/* Placeholder for other dashboard content */}
          {!isLoading && !error && categoriesExist && (
             <Box mt={6} p={6} borderWidth="1px" borderRadius="lg" shadow="md">
              <Heading as="h2" size="lg" mb={4}>Your Assigned Categories</Heading>
              <VStack align="start">
                {assignedCategories.map(cat => <Text key={cat.id}>- {cat.name}</Text>)}
              </VStack>
              <Link href="/vendor/profile" passHref>
                <Button as="a" colorScheme="gray" mt={4} size="sm">
                  Manage Categories
                </Button>
              </Link>
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