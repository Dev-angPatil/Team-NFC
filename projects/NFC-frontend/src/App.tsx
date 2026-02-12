import { SupportedWallet, WalletId, WalletManager, WalletProvider, useWallet } from '@txnlab/use-wallet-react'
import { SnackbarProvider } from 'notistack'
import { useState } from 'react'
import Account from './components/Account'
import ConnectWallet from './components/ConnectWallet'
import MintTicket from './components/MintTicket'
import PermissionManager from './components/PermissionManager'
import RegisterIdentity from './components/RegisterIdentity'
import VerifyEntry from './components/VerifyEntry'
import { getDefaultEventAssetId } from './utils/campusPassConfig'
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'

let supportedWallets: SupportedWallet[]
if (import.meta.env.VITE_ALGOD_NETWORK === 'localnet') {
  const kmdConfig = getKmdConfigFromViteEnvironment()
  supportedWallets = [
    {
      id: WalletId.KMD,
      options: {
        baseServer: kmdConfig.server,
        token: String(kmdConfig.token),
        port: String(kmdConfig.port),
      },
    },
  ]
} else {
  supportedWallets = [{ id: WalletId.DEFLY }, { id: WalletId.PERA }, { id: WalletId.EXODUS }]
}

function CampusPassPage() {
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [lastMintedAssetId, setLastMintedAssetId] = useState<number | null>(getDefaultEventAssetId())
  const { activeAddress } = useWallet()

  return (
    <div className="hero">
      <div className="campuspass-shell">
        <h1>CampusPass Web3</h1>
        <p>Algorand Testnet dApp for identity registration, NFT ticketing, and entry verification.</p>
        <button className="btn" onClick={() => setWalletModalOpen(true)}>
          {activeAddress ? 'Manage Wallet' : 'Connect Wallet'}
        </button>

        {activeAddress && <Account />}

        <RegisterIdentity />
        <MintTicket onMint={(assetId) => setLastMintedAssetId(assetId)} />
        <VerifyEntry initialAssetId={lastMintedAssetId} />
        <PermissionManager />

        <ConnectWallet openModal={walletModalOpen} closeModal={() => setWalletModalOpen(false)} />
      </div>
    </div>
  )
}

export default function App() {
  const algodConfig = getAlgodConfigFromViteEnvironment()

  const walletManager = new WalletManager({
    wallets: supportedWallets,
    defaultNetwork: algodConfig.network,
    networks: {
      [algodConfig.network]: {
        algod: {
          baseServer: algodConfig.server,
          port: algodConfig.port,
          token: String(algodConfig.token),
        },
      },
    },
    options: {
      resetNetwork: true,
    },
  })

  return (
    <SnackbarProvider maxSnack={4}>
      <WalletProvider manager={walletManager}>
        <CampusPassPage />
      </WalletProvider>
    </SnackbarProvider>
  )
}
