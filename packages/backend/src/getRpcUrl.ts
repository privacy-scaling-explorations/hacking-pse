import getNetwork from "./getNetwork";

/**
 * Get the RPC URL based on the network we are connected to
 * @returns the alchemy RPC URL
 */
export const getRpcUrl = (): string => {
    const chainId = getNetwork().id;

    if (!process.env.ALCHEMY_ID) {
        throw new Error("ALCHEMY_ID is not set");
    }

    switch (chainId) {
      case 10:
        return `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ID}`;
      case 11155420:
        return `https://opt-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_ID}`;
      default:
        return `https://opt-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_ID}`;
    }
  };