import React from "react";
import PotLockTokenLogo from "./PotLockTokenLogo.svg";
import "./FrontEndHome.css";

const FrontEndHome = () => {
  return (
    <div className="home-container">
      <div className="home-header">
        <img
          src={PotLockTokenLogo}
          alt="PotLockToken Logo"
          className="home-logo"
        />
        <h1 className="home-title">Welcome to PotLockToken!</h1>
      </div>
      <div className="home-content">
        <p className="home-description">
          PotLockToken is a revolutionary token with unique tokenomics designed
          for growth and community involvement.
        </p>

        <div className="home-feature-section">
          <h2 className="home-section-title">How It Works</h2>
          <div className="home-feature">
            <div className="feature-icon">🔥</div>
            <div className="feature-text">
              Users can buy tokens as they normally would, but <b>only one holder</b> can sell during the defined sell period.
            </div>
          </div>
          <div className="home-feature">
            <div className="feature-icon">🎲</div>
            <div className="feature-text">
              The selected wallet is randomly chosen and can sell for the duration 
              of the sell period. When it expires, token holders can burn tokens to 
              reset the lottery and select a new wallet.
            </div>
          </div>
          <div className="home-feature">
            <div className="feature-icon">📊</div>
            <div className="feature-text">
              The currently selected wallet, sell period, and other contract details 
              are displayed here for transparency.
            </div>
          </div>
        </div>

        <div className="home-feature-section">
          <h2 className="home-section-title">Tokenomics</h2>
          <div className="home-feature">
            <div className="feature-icon">💰</div>
            <div className="feature-text">
              <b>Total Supply:</b> 1,000,000 tokens
            </div>
          </div>
          <div className="home-feature">
            <div className="feature-icon">📈</div>
            <div className="feature-text">
              <b>Max Holding Per Wallet:</b> 100 tokens
            </div>
          </div>
          <div className="home-feature">
            <div className="feature-icon">🔥</div>
            <div className="feature-text">
              <b>Burn Mechanism:</b> Every burn changes the selling wallet.
            </div>
          </div>
          <div className="home-feature">
            <div className="feature-icon">⚖️</div>
            <div className="feature-text">
              <b>Taxes:</b> 1% Devs, 2% Liquidity
            </div>
          </div>
        </div>

        <div className="home-disclaimer">
          <h3 className="disclaimer-title">Disclaimer</h3>
          <p>
            Investing in cryptocurrencies involves significant risks, and you may
            lose all your money. Please do your own research and invest
            responsibly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FrontEndHome;
