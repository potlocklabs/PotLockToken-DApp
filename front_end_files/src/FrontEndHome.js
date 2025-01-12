import React, { useEffect, useState } from "react";
import {
  connectWallet,
  getCurrentWalletConnected,
  getContractVariables,
  burnTokens,
  addContractEventListeners,
  disconnectWallet, // Import the disconnect function
} from "./util/interact.js";

import PotLockTokenLogo from "./PotLockTokenLogo.svg";

const FrontEndHome = () => {
  const [walletAddress, setWallet] = useState("");
  const [status, setStatus] = useState("");
  const [contractData, setContractData] = useState({
    maxTokensPerWallet: 0,
    sellTimeframe: 0,
    totalSupply: 0,
  });
  const [burnAmount, setBurnAmount] = useState("");

  useEffect(() => {
    const initialize = async () => {
      const { address, status } = await getCurrentWalletConnected();
      setWallet(address);
      setStatus(status);

      loadContractVariables();
      addWalletListener();
      addSmartContractListener();
    };

    initialize();
  }, []);

  const loadContractVariables = async () => {
    const data = await getContractVariables();
    setContractData(data);
  };

  const addSmartContractListener = () => {
    addContractEventListeners({
      walletChosen: (error, event) => {
        if (!error) console.log("WalletChosen Event:", event.returnValues);
      },
      timeframeUpdated: (error, event) => {
        if (!error) console.log("TimeframeUpdated Event:", event.returnValues);
      },
      holderListUpdated: (error, event) => {
        if (!error) console.log("HolderListUpdated Event:", event.returnValues);
      },
      burn: (error, event) => {
        if (!error) console.log("Burn Event:", event.returnValues);
      },
    });
  };

  const addWalletListener = () => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          setStatus("Wallet connected.");
        } else {
          setWallet("");
          setStatus("🦊 Connect to Metamask using the top right button.");
        }
      });
    }
  };

  const connectWalletPressed = async () => {
    const walletResponse = await connectWallet();
    setStatus(walletResponse.status);
    setWallet(walletResponse.address);
  };

  const disconnectWalletPressed = () => {
    // Clear wallet address and status in your dApp
    setWallet("");
    setStatus("Wallet disconnected. Note: You must disconnect manually in MetaMask.");
    
    // Optional: Reload the page to ensure the app behaves like it's disconnected
    // window.location.reload();
    const response = disconnectWallet();
    //setWallet(response.address);
    //setStatus(response.status);
  };

  const burnTokensPressed = async () => {
    if (!burnAmount || isNaN(burnAmount) || Number(burnAmount) <= 0) {
      alert("Please enter a valid number of tokens to burn.");
      return;
    }
    const result = await burnTokens(burnAmount);
    if (result.success) {
      alert("Tokens burned successfully!");
      setBurnAmount(""); // Clear input after success
      loadContractVariables(); // Refresh contract variables
    } else {
      alert(`Error burning tokens: ${result.error}`);
    }
  };

  return (
    <div id="container">
      <img id="logo" src={PotLockTokenLogo} alt="PotLockTokenLogo logo"></img>
      <div style={{ display: "flex", gap: "10px 20px" }}>
        <button id="walletButton" onClick={connectWalletPressed}>
          {walletAddress.length > 0
            ? `Connected: ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`
            : "Connect Wallet"}
        </button>
        {walletAddress.length > 0 && (
          <button
            id="disconnectButton"
            onClick={disconnectWalletPressed}
            style={{
              padding: "10px 10px",
              backgroundColor: "#FF5733",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Disconnect Wallet
          </button>
        )}
      </div>

      <h2>PotLockToken Data:</h2>
      <p>Max Tokens Per Wallet: {contractData.maxTokensPerWallet}</p>
      <p>Sell Timeframe: {contractData.sellTimeframe}</p>
      <p>Total Supply: {contractData.totalSupply}</p>

      <h2>Burn Tokens:</h2>
      <div style={{ margin: "20px 0" }}>
        <input
          type="number"
          placeholder="Enter number of tokens to burn"
          onChange={(e) => setBurnAmount(e.target.value)}
          value={burnAmount}
          style={{
            padding: "10px",
            fontSize: "16px",
            marginRight: "10px",
            width: "200px",
          }}
        />
        <button
          onClick={burnTokensPressed}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Burn
        </button>
      </div>

      <p id="status">{status}</p>
    </div>
  );
};

export default FrontEndHome;
