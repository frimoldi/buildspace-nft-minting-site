import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import React, { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers"
import myEpicNft from './utils/MyEpicNFT.json'

// Constants
const TWITTER_HANDLE = 'fran_rimoldi';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const CONTRACT_ADDRESS = "0x5991dE28Ec6357a50f7329fd6257D1603C72827b"
const OPEN_SEA_LINK = "https://testnets.opensea.io/collection/south-park-gang-qwsxfnqupu"

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("")
  const [mintMax, setMintMax] = useState()
  const [mintedSoFar, setMintedSoFar] = useState()
  const [isMinting, setIsMinting] = useState(false)

  const loadMintStats = useCallback(async () => {
    try { 
      const { ethereum } = window
       if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer)

        const mintMax = await connectedContract.getMintMax();
        const mintedSoFar = await connectedContract.getTotalMinted();

        setMintMax(ethers.BigNumber.from(mintMax).toNumber());
        setMintedSoFar(ethers.BigNumber.from(mintedSoFar).toNumber());
      }
    } catch(error) {
      console.log(error)
    }
  }, [])
  
  const setupEventListener = useCallback(async () => {
    try {
      const { ethereum } = window

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer)

        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          loadMintStats()
          console.log(from, tokenId.toNumber())
          alert(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can a max of 10 imns to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()} `)
        })

        console.log("Setup event listener!")
      } 
    } catch (error) {
      console.log(error)
    }
  }, [loadMintStats])

  const checkIfWalletIsConnected = useCallback(async () => {
    const { ethereum } = window

    if (!ethereum) {
      console.log("Make sure you have Metamask!")
      return
    } else {
      console.log("We have the ethereum object", ethereum)
    }

    const chainId = await ethereum.request({ method: "eth_chainId" })
    console.log("Connected to chain ", chainId)

    const rinkebyChainId = "0x4"
    if (chainId !== rinkebyChainId) {
      alert("You are not connected to the Rinkeby Test Network!")
    }

    const accounts = await window.ethereum.request({method: "eth_accounts"})
    if (accounts.length !== 0) {
      const account = accounts[0]
      console.log("Found and authorized account", account)
      setCurrentAccount(account)

      setupEventListener()
    } else {
      console.log("No authorized account found")
    }
  },[setupEventListener])

  const connectWallet = async () => {
    try {
      const { ethereum } = window

      if (!ethereum) {
        alert("Get MetaMask!")
        return
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" })

      console.log("Connected", accounts[0])
      setCurrentAccount(accounts[0])

      setupEventListener()
    } catch (error) {
      console.log(error)
    }
  }

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer)

        console.log("Going to pop wallet now to pay gas ...")
        setIsMinting(true)
        let nftTxn = await connectedContract.makeAnEpicNFT()

        console.log("Mining... please wait.")
        await nftTxn.wait()

        console.log(`Minted, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`)
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error)
    } finally {
      setIsMinting(false)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected()  
    loadMintStats()
  }, [checkIfWalletIsConnected, loadMintStats])
  

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {
            currentAccount === "" ? (
              <button className="cta-button connect-wallet-button" onClick={connectWallet}>
                Connect to Wallet
              </button>
            ) : (
              <>
                {mintedSoFar !== undefined && mintMax !== undefined && <span className="minted">{`${mintedSoFar}/${mintMax} minted so far`}</span>}
                <br />
                <button onClick={askContractToMintNft} className="cta-button connect-wallet-button" disabled={isMinting}>
                  {isMinting ? "Minting ..." : "Mint NFT"}
                </button>
              </>
            )
          }
          <a href={OPEN_SEA_LINK} target="_blank" rel="noreferrer" className="os-link">{"🌊 View Collection on OpenSea"}</a>
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
