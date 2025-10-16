// wallet_connect_handler.js (Updated Version with Burn Functionality)

import { createAppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { bsc } from '@reown/appkit/networks';
import { Contract, formatUnits, BrowserProvider, parseUnits } from 'ethers';
import { createConfig, http } from 'wagmi';
import Chart from 'chart.js/auto';

// Assume wagmiConfig.js exports 'wagmiConfig'
import { wagmiConfig } from "./wagmiConfig";
import { bsc as wagmiBsc } from 'wagmi/chains'; // Add this import for wagmi's bsc chain object

const contractAddress = '0xa40600406fec82f67d3E8e4607CD92bD6F9F0290';
const contractABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function currentSellWallet() view returns (address)",
  "function minHolderBalance() view returns (uint256)", 
  "function maxTokensPerWallet() view returns (uint256)",
  "function burn(uint256 amount) public" // <-- ADDED: Burn function to ABI
];

// Helper function
function shorten(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID; // or process.env.VITE_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error("WalletConnect Project ID is not defined in the environment variables.");
}

// --- Create appKit instance inside a function so we can recreate it ---
let appKit;
function createAppKitInstance() {
  return createAppKit({
    adapters: [new WagmiAdapter({
      projectId: projectId,
      networks: [bsc], // AppKit's bsc from @reown/appkit/networks
      wagmiConfig,
      chains: [wagmiBsc], // Use wagmi's bsc here
      autoConnect: false,
      recommendedInjectedWallets: ['metamask', 'coinbase'],
      recommendedMobileWallets: ['trust', 'rainbow', 'metamask']
    })],
    networks: [bsc], // Networks AppKit will display for switching (from @reown/appkit/networks)
    projectId: projectId
  });
}
appKit = createAppKitInstance();

// Use a flag to prevent multiple rapid UI updates during connection
let isUpdatingUI = false;
let walletMaxPieChart = null; // Initialize to null for better state management

document.addEventListener('DOMContentLoaded', async () => {
  // ... (all your existing consts remain unchanged)
  const connectWalletBtn = document.getElementById('connectWalletBtn');
  const walletAddressDisplayP = document.getElementById('walletAddressDisplay');
  const walletAddressSpan = document.getElementById('walletAddress');
  const tokenBalanceSpan = document.getElementById('tokenBalance');
  const isCurrentSellerSpan = document.getElementById('isCurrentSeller');
  const selectedWalletSpan = document.getElementById('selectedWallet'); 
  //const minHolderBalanceSpan = document.getElementById('minHolderBalanceLive');
  const walletMaxPieChartCanvas = document.getElementById('walletMaxPieChart');
  const burnAmountInput = document.getElementById('burnAmount');
  const burnButton = document.getElementById('burnButton');
  const burnStatusSpan = document.getElementById('burnStatus');

  connectWalletBtn.disabled = true;

  await appKit.ready();
  console.log("AppKit is ready.");

  connectWalletBtn.disabled = false;

  // 🟢 Added: WalletConnect relay event handlers — listens for relay disconnect/reconnect, allowing UI or retry logic. These are required best‑practices per SDK documentation.  
  //   core.relayer.on("relayer_disconnect", …) and relayer_connect events are recommended to detect WebSocket loss/recovery :contentReference[oaicite:1]{index=1}
  // 🟢 Add checks to avoid accessing relayer if it's not available
  if (appKit.core?.relayer) {
    appKit.core.relayer.on("relayer_disconnect", () => {
      console.warn("WalletConnect relay disconnected — disable UI or show offline banner");
      connectWalletBtn.disabled = true;
    });

    appKit.core.relayer.on("relayer_connect", () => {
      console.log("WalletConnect relay re‑connected — user is back online");
      connectWalletBtn.disabled = false;
      setTimeout(updateUIWithAccountState, 300);
    });
  } else {
    console.warn("appKit.core.relayer is undefined. Skipping relay event listeners.");
  }

  // 📱 Added: On iOS/Safari when user switches out of browser, tab visibilitychange fires on return; attempt reconnect manually.
  //   This helps recover WebSocket when Safari suspended JS. Uses manual reconnect fallback if needed.  
  window.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible") {
      console.log("Document visible again — checking relayer");

      try {
        // Check for relayer presence before calling .connect()
        if (appKit.core?.relayer && typeof appKit.core.relayer.connect === "function") {
          await appKit.core.relayer.connect();
          console.log("Manual relayer.connect() succeeded");
        } else {
          console.warn("Relayer not available on visibilitychange — skipping reconnect");
        }
      } catch (err) {
        console.error("Manual reconnect attempt failed:", err);
      }

      setTimeout(updateUIWithAccountState, 500);
    }
  });


  // Create chart instance once on page load, but with empty data
  const chartCtx = walletMaxPieChartCanvas.getContext('2d');
  walletMaxPieChart = new Chart(chartCtx, {
    type: 'doughnut', // 'doughnut' is better for this use case
    data: {
      labels: ['Your Balance', 'Remaining Capacity'],
      datasets: [{
        data: [0, 100], // Default data
        backgroundColor: ['#d1d0d0ff', '#d1d0d0ff'],
        borderColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      animation: {
        duration: 0
      }
    }
  });

  function resetUI() {
    console.log("Entering ResetUI");
    walletAddressSpan.textContent = '';
    walletAddressDisplayP.style.display = 'none';
    tokenBalanceSpan.textContent = 'Please connect wallet or buy $PLT';
    isCurrentSellerSpan.textContent = 'Connect wallet to find out';
    connectWalletBtn.textContent = 'Connect Wallet';
    connectWalletBtn.disabled = false;
    selectedWalletSpan.textContent = 'Connect wallet to find out';
    isCurrentSellerSpan.style.color = '';
    selectedWalletSpan.style.fontSize = '';
    connectWalletBtn.disabled = false;
    //minHolderBalanceSpan.textContent = '--';
    
    // Clear burn UI
    burnAmountInput.value = '';
    burnStatusSpan.textContent = '';

    // Clear chart data on reset
    if (walletMaxPieChart) {
      walletMaxPieChart.data.datasets[0].data = [0, 100];
      walletMaxPieChart.data.datasets[0].backgroundColor = ['#d1d0d0ff', '#d1d0d0ff'];
      walletMaxPieChart.update();
    }
  }

  async function updateUIWithAccountState() {
    if (isUpdatingUI) {
      console.log("updateUIWithAccountState: Already updating, skipping.");
      return;
    }
    isUpdatingUI = true;

    console.log("Entering updateUIWithAccountState");
    let account = null;
    let provider = null;

    try {
      account = await appKit.getAccount();
      console.log("AppKit.getAccount() result:", account);
      if (!account?.isConnected || !account?.address) {
        console.log("Account not fully connected. Resetting UI.");
        resetUI();
        isUpdatingUI = false;
        return;
      }

      console.log(`Account details: Address: ${account.address}, Connected: ${account.isConnected}, ChainId: ${account.chainId}`);

      let retryCount = 0;
      const maxRetries = 10;
      const retryDelayMs = 200;

      while (!provider && retryCount < maxRetries) {
        try {
          provider = await appKit.getWalletProvider({ namespace: 'eip155' });
          if (!provider) {
            console.warn(`AppKit.getProvider() returned undefined. Retrying in ${retryDelayMs}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelayMs));
            retryCount++;
          }
        } catch (providerError) {
          console.warn(`Error getting provider: ${providerError.message}. Retrying...`);
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          retryCount++;
        }
      }
      console.log("AppKit.getProvider() final result:", provider);
    } catch (err) {
      console.error("Unhandled error during account/provider retrieval:", err);
      resetUI();
      isUpdatingUI = false;
      return;
    }

    if (!account?.isConnected || !account?.address || !provider) {
      console.log("Not connected or provider unavailable. Resetting UI.");
      resetUI();
      isUpdatingUI = false;
      return;
    }

    const address = account.address;

    connectWalletBtn.textContent = 'Disconnect Wallet';
    walletAddressSpan.textContent = shorten(address);
    walletAddressDisplayP.style.display = 'block';
    console.log("Wallet Displayed:", address);

    let ethersProviderInstance;
    if (provider && typeof provider.request === 'function') {
      ethersProviderInstance = new BrowserProvider(provider);
      console.log("Wrapped EIP-1193 provider with BrowserProvider.");
    } else if (provider && typeof provider.getBalance === 'function') {
      ethersProviderInstance = provider;
      console.log("Provider is already an ethers‑compatible provider.");
    } else {
      console.error("Invalid or unsupported provider received for contract interaction:", provider);
      tokenBalanceSpan.textContent = 'Provider Error';
      isCurrentSellerSpan.textContent = 'Provider Error';
      isUpdatingUI = false;
      return;
    }

    const token = new Contract(contractAddress, contractABI, ethersProviderInstance);
    try {
      const [
        balanceRaw, 
        decimals, 
        currentSeller, 
        //minHolderBalanceRaw, 
        maxTokensPerWalletRaw
      ] = await Promise.all([
        token.balanceOf(address),
        token.decimals(),
        token.currentSellWallet(),
        //token.minHolderBalance(),
        token.maxTokensPerWallet()
      ]);
      
      const balance = parseFloat(formatUnits(balanceRaw, decimals));
      //const minHolderBalance = parseFloat(formatUnits(minHolderBalanceRaw, decimals));
      const maxTokensPerWallet = parseFloat(formatUnits(maxTokensPerWalletRaw, decimals));
      
      // Update the UI
      tokenBalanceSpan.textContent = `${balance.toFixed(2)} $PLT`;
      const isSeller = (address.toLowerCase() === currentSeller.toLowerCase());
      isCurrentSellerSpan.textContent = isSeller ? 'Yes' : 'No';

      if (isSeller) {
        isCurrentSellerSpan.style.color = 'green';

        // Confetti effect — you can use a library like canvas-confetti
        import('https://cdn.skypack.dev/canvas-confetti').then(({ default: confetti }) => {
          confetti({
            particleCount: 200,
            spread: 70,
            origin: { y: 0.6 }
          });
        });

      } else {
        isCurrentSellerSpan.style.color = 'red';
      }
      selectedWalletSpan.textContent = (currentSeller);
      selectedWalletSpan.style.fontSize = '0.95rem'
      //minHolderBalanceSpan.textContent = `${minHolderBalance.toFixed(2)}`;

      // Update the chart data
      if (walletMaxPieChart) {
        let chartData;
        let chartLabels;
        let chartColors;

        if (balance >= maxTokensPerWallet) {
          chartData = [maxTokensPerWallet, 0];
          chartLabels = [`Your Balance (Maxed: ${maxTokensPerWallet.toFixed(2)} $PLT)`, ''];
          chartColors = ['#59b0f8ff', '#d1d0d0ff'];
        } else {
          const remainingCapacity = maxTokensPerWallet - balance;
          chartData = [balance, remainingCapacity];
          chartLabels = [`Your Balance (${balance.toFixed(2)} $PLT)`, `Remaining Capacity (${remainingCapacity.toFixed(2)} $PLT)`];
          chartColors = ['#59b0f8ff', '#d1d0d0ff'];
        }

        walletMaxPieChart.data.labels = chartLabels;
        walletMaxPieChart.data.datasets[0].data = chartData;
        walletMaxPieChart.data.datasets[0].backgroundColor = chartColors;
        walletMaxPieChart.update();
      }

    } catch (err) {
      console.error("Error fetching contract data:", err);
      tokenBalanceSpan.textContent = 'Error';
      isCurrentSellerSpan.textContent = 'Error';
      // Reset chart on error
      if (walletMaxPieChart) {
        walletMaxPieChart.data.datasets[0].data = [0, 100];
        walletMaxPieChart.data.datasets[0].backgroundColor = ['#d1d0d0ff', '#d1d0d0ff'];
        walletMaxPieChart.update();
      }
    } finally {
      isUpdatingUI = false;
      console.log("Exiting updateUIWithAccountState.");
    }
  }

  // <--- NEW: Burn functionality block starts here
  async function handleBurn() {
    const amountToBurn = burnAmountInput.value;
    if (!amountToBurn || isNaN(parseFloat(amountToBurn)) || parseFloat(amountToBurn) <= 0) {
      burnStatusSpan.textContent = 'Please enter a valid amount to burn';
      burnStatusSpan.style.color = 'red';
      return;
    }

    try {
      burnButton.disabled = true;
      burnStatusSpan.textContent = 'Sending transaction...';
      burnStatusSpan.style.color = 'orange';

      // Re-fetch provider and account to ensure they are current
      const account = await appKit.getAccount();
      if (!account?.isConnected || !account?.address) {
        throw new Error('Wallet not connected');
      }
      const provider = await appKit.getWalletProvider({ namespace: 'eip155' });
      if (!provider) {
        throw new Error('Provider not available');
      }

      // We need a Signer to send a transaction
      const ethersProvider = new BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      // Get decimals to format the burn amount correctly
      const tokenView = new Contract(contractAddress, ["function decimals() view returns (uint8)"], ethersProvider);
      const decimals = await tokenView.decimals();
      const amountInWei = parseUnits(amountToBurn, decimals);

      // Create a contract instance with the signer
      const tokenWithSigner = new Contract(contractAddress, contractABI, signer);

      // Call the burn function
      const tx = await tokenWithSigner.burn(amountInWei);
      burnStatusSpan.textContent = `Transaction submitted. Waiting for confirmation... Hash: ${shorten(tx.hash)}`;
      burnStatusSpan.style.color = 'orange';
      
      // Wait for the transaction to be mined
      await tx.wait();

      burnStatusSpan.textContent = 'Burn successful!';
      burnStatusSpan.style.color = 'green';
      burnAmountInput.value = ''; // Clear the input field

      // Refresh the UI to show the new balance after the burn
      setTimeout(updateUIWithAccountState, 1000); 

    } catch (err) {
      console.error("Burn transaction failed:", err);
      // Ethers/WalletConnect will throw an error on user rejection
      if (err.message.includes('user rejected transaction') || err.message.includes('canceled') || err.code === 4001) {
        burnStatusSpan.textContent = 'Transaction rejected by user';
      } else {
        burnStatusSpan.textContent = `Error: ${err.reason || err.message}`;
      }
      burnStatusSpan.style.color = 'red';
    } finally {
      burnButton.disabled = false;
    }
  }

  burnButton.addEventListener('click', handleBurn);
  // ---> NEW: Burn functionality block ends here

  appKit.subscribeProviders(state => {
    console.log("AppKit Providers updated (EVM state received).");
    setTimeout(updateUIWithAccountState, 200);
  });

  appKit.subscribeState(modalState => {
    console.log("AppKit Modal State:", modalState);
    if (!modalState.open && modalState.view === 'Connect') {
      console.log("Connect modal closed – will refresh connection state.");
      setTimeout(updateUIWithAccountState, 500);
    } else if (!modalState.open && modalState.view === 'Disconnect') {
      console.log("Disconnect modal closed - will refresh connection state.");
      setTimeout(updateUIWithAccountState, 300);
    }
  });

  connectWalletBtn.addEventListener('click', async () => {
    try {
      const current = await appKit.getAccount();
      console.log("Button click - current state before action:", current);

      if (current?.address && current.isConnected) {
        console.log("Disconnecting wallet via button...");
        await disconnectAndReset();
      } else {
        console.log("Opening connect modal via button...");
        await appKit.open({ view: 'Connect', namespace: 'eip155' });
      }
    } catch (err) {
      console.error("Wallet connect/disconnect operation failed:", err);
      resetUI();
    }
  });

  // --- Add this function for disconnect+reset + recreate appKit ---
  async function disconnectAndReset() {
    try {
      await appKit.disconnect();
      resetUI();

      // Clear WalletConnect session forcibly if exists to avoid cached sessions
      if (appKit.core?.walletConnectSession) {
        appKit.core.walletConnectSession = null;
      }

      // Recreate appKit instance to guarantee fresh connection on reconnect
      appKit = createAppKitInstance();
      await appKit.ready();

      console.log("appKit re-initialized after disconnect.");
    } catch (err) {
      console.error("Error during disconnect/reset:", err);
      resetUI();
    }
  }

  // --- Clean up on page unload/tab close to disconnect properly ---
  window.addEventListener('pagehide', async () => {
    try {
      const current = await appKit.getAccount();
      if (current?.isConnected) {
        console.log("Page is unloading, disconnecting wallet...");
        await appKit.disconnect();
      }
    } catch (err) {
      console.warn("Error disconnecting on page unload:", err);
    }
  });

  setTimeout(updateUIWithAccountState, 100);
});