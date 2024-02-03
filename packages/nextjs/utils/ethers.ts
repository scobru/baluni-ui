import { providers } from "ethers";
import { WalletClient } from "wagmi";

export function clientToSigner(client: WalletClient) {
  const provider = new providers.Web3Provider(client.transport, "any");
  const signer = provider.getSigner();
  return signer;
}
