import Web3 from "web3";
import abi from "../contract-abi"; // Replace with your contract's ABI JSON file

const CONTRACT_ADDRESS = "0x1f6E606B19dDe168145e50f5B37c9E8e3d6F4A24"; // Replace with your contract's address

let web3;
let tokenContract;

// Initialize Web3 and contract
if (window.ethereum) {
  web3 = new Web3(window.ethereum);
  tokenContract = new web3.eth.Contract(abi, CONTRACT_ADDRESS);
}

export const connectWallet = async () => {
  if (window.ethereum) {
    try {
      const addressArray = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      return {
        address: addressArray[0],
        status: "Wallet connected.",
      };
    } catch (err) {
      return {
        address: "",
        status: "😥 " + err.message,
      };
    }
  } else {
    return {
      address: "",
      status: "Metamask is not installed.",
    };
  }
};

export const disconnectWallet = () => {
  return {
    address: "",
    status: "🦊 Wallet disconnected.",
  };
};

export const getCurrentWalletConnected = async () => {
  if (window.ethereum) {
    try {
      const addressArray = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (addressArray.length > 0) {
        return {
          address: addressArray[0],
          status: "Wallet connected.",
        };
      } else {
        return {
          address: "",
          status: "🦊 Connect to Metamask using the top right button.",
        };
      }
    } catch (err) {
      return {
        address: "",
        status: "😥 " + err.message,
      };
    }
  } else {
    return {
      address: "",
      status: "Metamask is not installed.",
    };
  }
};

export const getContractVariables = async () => {
  try {
    const maxTokensPerWallet = await tokenContract.methods.maxTokensPerWallet().call();
    const sellTimeframe = await tokenContract.methods.sellTimeframe().call();
    const totalSupply = await tokenContract.methods.totalSupply().call();
    return { maxTokensPerWallet, sellTimeframe, totalSupply };
  } catch (error) {
    console.error("Error fetching contract variables:", error);
    return { maxTokensPerWallet: 0, sellTimeframe: 0, totalSupply: 0 };
  }
};

export const burnTokens = async (amount) => {
  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    const fromAddress = accounts[0];

    const receipt = await tokenContract.methods.burn(web3.utils.toWei(amount, "ether")).send({
      from: fromAddress,
    });

    console.log("Burn transaction receipt:", receipt);
    return { success: true };
  } catch (error) {
    console.error("Error burning tokens:", error);
    return { success: false, error: error.message };
  }
};

export const addContractEventListeners = (listeners) => {
  if (!tokenContract) return;

  if (listeners.walletChosen) {
    tokenContract.events.WalletChosen().on("data", listeners.walletChosen).on("error", console.error);
  }

  if (listeners.timeframeUpdated) {
    tokenContract.events.TimeframeUpdated().on("data", listeners.timeframeUpdated).on("error", console.error);
  }

  if (listeners.holderListUpdated) {
    tokenContract.events.HolderListUpdated().on("data", listeners.holderListUpdated).on("error", console.error);
  }

  if (listeners.burn) {
    tokenContract.events.Burn().on("data", listeners.burn).on("error", console.error);
  }
};

export { tokenContract };
