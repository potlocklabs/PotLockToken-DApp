import { JsonRpcProvider, Contract, formatUnits, parseUnits } from 'ethers';
import Chart from 'chart.js/auto';

document.addEventListener('DOMContentLoaded', async function () {
  const tokenAddress = '0xa023B6d35A4d6684627fE15E260CaF459414b2B2';
  const tokenDecimals = 18;

  const erc20Abi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function burn(uint256 amount)",
    "function owner() view returns (address)",
    "function liquidityWallet() view returns (address)",
    "function currentSellWallet() view returns (address)",
    "function MAX_SUPPLY() view returns (uint256)",
    "function maxTokensPerWallet() view returns (uint256)",
    "function sellTimeframe() view returns (uint256)",
    "function lastWalletChange() view returns (uint256)",
    "function minHolderBalance() view returns (uint256)",
    "function isExemptFromAllRestrictions(address) view returns (bool)",
    "function getHolderListLength() view returns (uint256)"
  ];

  const sellCountdownSpan = document.getElementById('sellCountdown');
  const lastChangeAgoSpan = document.getElementById('lastChangeAgo');
  const holderCountSpan = document.getElementById('holderCount');
  const maxSupplySpan = document.getElementById('maxSupply');
  const currentSupplySpan = document.getElementById('currentSupply');
  const maxPerWalletSpan = document.getElementById('maxPerWallet');
  const minHolderBalanceSpan = document.getElementById('minHolderBalance');
  const burnedSupplySpan = document.getElementById('burnedSupply');
  const burnExplosion = document.getElementById('burnExplosion');

  let sellTimeframe = 0;
  let lastWalletChange = 0;
  let tokenSymbol = "PLT";
  let burnPieChart = null;

  function formatUnits(val) {
    const raw = parseFloat(ethers.utils.formatUnits(val, tokenDecimals));
    if (raw >= 1_000_000_000) return (raw / 1_000_000_000).toFixed(2) + "B";
    if (raw >= 1_000_000) return (raw / 1_000_000).toFixed(2) + "M";
    if (raw >= 1_000) return (raw / 1_000).toFixed(2) + "k";
    if (raw >= 1) return raw.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 });
    if (raw > 0) {
      const str = raw.toPrecision(3);
      const match = str.match(/^0\.0*(\d+)/);
      if (match) return `0.${"0".repeat(str.split('.')[1].length - match[1].length)}${match[1]}`;
      return str;
    }
    return "0";
  }

  function timeAgo(secondsAgo) {
    const mins = Math.floor(secondsAgo / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    if (mins > 0) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
    return `${secondsAgo} second${secondsAgo !== 1 ? 's' : ''} ago`;
  }

  async function updatePublicTokenInfo() {
    try {
      const rpcProvider = new JsonRpcProvider('https://bsc-dataseed.binance.org/');
      const rpcContract = new Contract(tokenAddress, erc20Abi, rpcProvider);
      const timeframe = Number(await rpcContract.sellTimeframe());
      const lastChange = Number(await rpcContract.lastWalletChange());
      const nowUnix = Math.floor(Date.now() / 1000);
      const elapsed = nowUnix - lastChange;

      if (lastChangeAgoSpan) lastChangeAgoSpan.textContent = timeAgo(elapsed);
      if (holderCountSpan) holderCountSpan.textContent = (await rpcContract.getHolderListLength()).toString();
      if (maxSupplySpan) maxSupplySpan.textContent = formatUnits(await rpcContract.MAX_SUPPLY());
      if (currentSupplySpan) currentSupplySpan.textContent = formatUnits(await rpcContract.totalSupply());
      if (maxPerWalletSpan) maxPerWalletSpan.textContent = formatUnits(await rpcContract.maxTokensPerWallet());
      if (minHolderBalanceSpan) minHolderBalanceSpan.textContent = formatUnits(await rpcContract.minHolderBalance());

      const maxS = await rpcContract.MAX_SUPPLY();
      const curS = await rpcContract.totalSupply();
      const burned = BigInt(maxS) - BigInt(curS);
      if (burnedSupplySpan) burnedSupplySpan.textContent = formatUnits(burned);

      const currentVal = parseFloat(ethers.utils.formatUnits(curS, tokenDecimals));
      const burnedVal = parseFloat(ethers.utils.formatUnits(burned, tokenDecimals));
      const chartCtx = document.getElementById('burnPieChart')?.getContext('2d');
      if (chartCtx) {
        if (burnPieChart) {
          burnPieChart.data.datasets[0].data = [currentVal, burnedVal];
          burnPieChart.update();
        } else {
          burnPieChart = new Chart(chartCtx, {
            type: 'pie',
            data: {
              labels: ['Current Supply', 'Burned Supply'],
              datasets: [{
                data: [currentVal, burnedVal],
                backgroundColor: ['#4CAF50', '#FF3B30'],
                borderColor: 'rgba(255,255,255,0.4)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              plugins: { legend: { display: true, position: 'bottom' } }
            }
          });
        }
      }

      sellTimeframe = timeframe;
      lastWalletChange = lastChange;
    } catch (err) {
      console.error("updatePublicTokenInfo failed:", err);
    }
  }

  function updateCountdown() {
    if (!sellTimeframe || !lastWalletChange || !sellCountdownSpan) return;

    const now = Math.floor(Date.now() / 1000);
    const remaining = Math.max(0, (lastWalletChange + sellTimeframe) - now);

    if (remaining === 0) {
      sellCountdownSpan.textContent = "Timer expired! Burn tokens to trigger the next wallet selection!";
      sellCountdownSpan.style.color = 'red';
      window.startBlinkingExpiredMessage?.();
    } else {
      const hours = String(Math.floor(remaining / 3600)).padStart(2, '0');
      const mins = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
      const secs = String(remaining % 60).padStart(2, '0');
      sellCountdownSpan.textContent = `${hours}:${mins}:${secs}`;
      sellCountdownSpan.style.color = 'black';
      window.stopBlinkingExpiredMessage?.();
    }
  }

  setTimeout(() => updatePublicTokenInfo().catch(console.error), 200);
  setInterval(updateCountdown, 1000);

  let publicUpdateCount = 0;
  const maxFastUpdates = 5;
  async function schedulePublicTokenInfoUpdate() {
    try {
      await updatePublicTokenInfo();
      publicUpdateCount++;
      const next = publicUpdateCount < maxFastUpdates ? 2000 : 30000;
      setTimeout(schedulePublicTokenInfoUpdate, next);
    } catch (err) {
      console.error("Failed public update:", err);
      setTimeout(schedulePublicTokenInfoUpdate, 30000);
    }
  }
  schedulePublicTokenInfoUpdate();
});
