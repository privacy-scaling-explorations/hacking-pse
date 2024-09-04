import { optimism, optimismSepolia } from "viem/chains";
import dotenv from "dotenv";
dotenv.config();

export default function getNetwork() {
  const network = process.argv[3];

  switch (network) {
    case "optimism":
      return optimism;
    case "optimism-sepolia":
      return optimismSepolia;
    default:
      return optimismSepolia;
  }
}
