import { createConfig, http } from 'wagmi';
import { bsc } from 'wagmi/chains'; // Make sure you're importing 'bsc' from wagmi/chains
import { walletConnect } from 'wagmi/connectors';

// Get the project ID from the environment variable
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID; // or process.env.VITE_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error("WalletConnect Project ID is not defined in the environment variables.");
}

export const wagmiConfig = createConfig({
  chains: [bsc], // Ensure bsc is here and correctly imported
  connectors: [
    walletConnect({ projectId }), // Your project ID
    // Add other connectors if you want, e.g., injected
  ],
  transports: {
    [bsc.id]: http('https://bsc-dataseed.binance.org'), // This is crucial for the provider
    // Or you could use the default from wagmi/chains if it includes a public RPC:
    // [bsc.id]: http(), // If bsc already has a default RPC configured
  },
  autoConnect: false,
});