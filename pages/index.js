import Head from 'next/head'
import Web3Modal from 'web3modal'
import { Contract, providers, utils } from 'ethers'
import React, { useEffect, useRef, useState } from 'react'

import styles from '../styles/Home.module.css'
import { abi, NFT_CONTRACT_ADDRESS } from '../constants'

export default function Home() {
  const web3ModalRef = useRef()

  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [presaleEnded, setPresaleEnded] = useState(false)
  const [tokenIdsMinted, setTokenIdsMinted] = useState('0')
  const [presaleStarted, setPresaleStarted] = useState(false)
  const [walletConected, setWalletConnected] = useState(false)

  const presaleMint = async () => {
    try {
      const signer = await getProviderOrSigner(true)

      const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)

      const tx = await whitelistContract.presaleMint({
        value: utils.parseEther('0.01')
      })
      
      setLoading(true)

      await tx.wait()

      setLoading(false)

      window.alert('You successfully minted a Crypto Dev!')
    } catch (error) {
      console.error(error)
    }
  }

  const publicMint = async () => {
    try {
      const signer = await getProviderOrSigner(true)

      const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)

      const tx = await whitelistContract.mint({
        value: utils.parseEther('0.01')
      })
      
      setLoading(true)

      await tx.wait()

      setLoading(false)

      window.alert('You successfully minted a Crypto Dev!')
    } catch (error) {
      console.error(error)
    }
  }

  const connectWallet = async () => {
    try {
      await getProviderOrSigner()

      setWalletConnected(true)
    } catch (error) {
      console.error(error)
    }
  }

  const startPresale = async () => {
    try {
      const signer = await getProviderOrSigner(true)

      const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)

      const tx = await whitelistContract.startPresale()

      setLoading(true)

      await tx.wait()

      setLoading(false)

      await checkIfPresaleStarted()
    } catch (error) {
      console.error(error)
    }
  }

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner()

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)

      const _presaleStarted = await nftContract.presaleStarted()

      if (!_presaleStarted) await getOwner() 

      setPresaleEnded(_presaleStarted)

      return _presaleStarted
    } catch (error) {
      console.error(error)

      return false
    }
  }

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner()

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)

      const _presaleEnded = await nftContract.presaleEnded()

      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000))

      if (hasEnded) setPresaleEnded(true)
      else setPresaleEnded(false)

      return hasEnded
    } catch (error) {
      console.error(error)

      return false
    }
  }

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner()

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)

      const _owner = await nftContract.owner()

      const signer = await getProviderOrSigner(true)

      const address = await signer.getAddress()

      if (address.toLowerCase() === _owner.toLowerCase()) setIsOwner(true)
    } catch (error) {
      console.error(error.message)
    }
  }

  const getTokenIdsMinted = async () => {
    try {
      const provider = await getProviderOrSigner()

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)

      const _tokenIds = await nftContract.tokensIds()

      setTokenIdsMinted(_tokenIds.toString())
    } catch (error) {
      console.error(error)
    }
  }

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect()
    const web3Provider = new providers.Web3Provider(provider)

    const { chainId } = await web3Provider.getNetwork()

    if (chainId !== 4) {
      window.alert('Change the network to Rinkeby')
      throw new Error('Change the network to Rinkeby')
    }

    if (needSigner) {
      const signer = web3Provider.getSigner()

      return signer
    }

    return web3Provider
  }

  useEffect(() => {
    if (!walletConected) {
      web3ModalRef.current = new Web3Modal({
        network: 'rinkeby',
        providerOptions: {},
        disableInjectedProvider: false
      })

      connectWallet()

      const _presaleStarted = checkIfPresaleStarted()
      
      if (_presaleStarted) checkIfPresaleEnded()

      getTokenIdsMinted()

      const presaleEndedInterval = setInterval(async () => {
        const _presaleStarted = await checkIfPresaleStarted()

        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded()

          if (_presaleEnded)  clearInterval(presaleEndedInterval)
        }
      }, 5 * 1000)

      setInterval(async () => {
        await getTokenIdsMinted()
      }, 5 * 1000)
    }
  }, [walletConected])

  const renderButton = () => {
    if (!walletConected) 
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      )

    if (loading) 
      return <button className={styles.button}>Loading...</button>

    if (isOwner && !presaleStarted)
      return(
        <button className={styles.button} onClick={startPresale}>
          Start presale!
        </button>
      )
    
    if (!presaleStarted)
      return(
        <div>
          <div className={styles.description}> Presale hasnt started! </div>
        </div>
      )

    if (presaleStarted && !presaleEnded)
      return(
        <div>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint a Crypto Dev 🥳
          </div>

          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      )
    
    if (presaleStarted && presaleEnded)
      return(
        <button className={styles.button} onClick={publicMint}>
          Public Mint 🚀
        </button>
      )
  }

  return(
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="NFT Collection" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>

          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>

          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>

          {renderButton()}
        </div>

        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" alt="" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  )
}