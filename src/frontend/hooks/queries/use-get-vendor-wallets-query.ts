import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { VendorSmartWalletsResponse } from "pages/api/vendors/smart-wallets";

const fetchVendorWallets = async (): Promise<VendorSmartWalletsResponse> => {
  const { data } = await axios.get<VendorSmartWalletsResponse>(
    "/api/vendors/smart-wallets",
  );
  return data;
};

export const useGetVendorWallets = () => {
  return useQuery<VendorSmartWalletsResponse, Error>({
    queryKey: ["vendorWallets"],
    queryFn: fetchVendorWallets,
    // Add any other react-query options here
  });
};
