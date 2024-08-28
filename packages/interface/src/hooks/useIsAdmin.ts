import { config } from "~/config";
import useSmartAccount from "./useSmartAccount";

export function useIsAdmin(): boolean {
  // TODO: (merge-ok) figure out how we set embedded smart account to admin
  const { address } = useSmartAccount();

  return config.admin === address!;
}
