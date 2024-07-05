import { providers } from "ethers";

export function clientToSigner(client: any) {
  const provider = new providers.Web3Provider(client.transport, "any");
  const signer = provider.getSigner();
  return signer;
}
