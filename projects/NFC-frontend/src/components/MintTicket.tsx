import algosdk from 'algosdk'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { getAlgodClient } from '../utils/algorandClients'

interface MintTicketProps {
  onMint?: (assetId: number) => void
}

async function getMetadataHash(value: string): Promise<Uint8Array> {
  const encoded = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', encoded)
  return new Uint8Array(hash)
}

export default function MintTicket({ onMint }: MintTicketProps) {
  const { activeAddress, transactionSigner } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const [eventName, setEventName] = useState('CampusPass Testnet Event')
  const [assetUrl, setAssetUrl] = useState('https://campuspass.local/ticket')
  const [mintedAssetId, setMintedAssetId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const algodClient = getAlgodClient()

  const mintTicket = async () => {
    if (!activeAddress || !transactionSigner) {
      enqueueSnackbar('Connect wallet first', { variant: 'warning' })
      return
    }

    setLoading(true)
    try {
      const params = await algodClient.getTransactionParams().do()
      const metadataHash = await getMetadataHash(`${eventName}:${Date.now().toString()}`)
      const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        total: 1,
        decimals: 0,
        defaultFrozen: false,
        manager: activeAddress,
        reserve: activeAddress,
        freeze: activeAddress,
        clawback: activeAddress,
        unitName: 'CPASS',
        assetName: eventName,
        assetURL: assetUrl,
        assetMetadataHash: metadataHash,
        suggestedParams: params,
      })

      const atc = new algosdk.AtomicTransactionComposer()
      atc.addTransaction({ txn, signer: transactionSigner })
      const result = await atc.execute(algodClient, 4)
      const txId = result.txIDs[0]
      const pending = await algodClient.pendingTransactionInformation(txId).do()
      const createdAssetId = Number(pending.assetIndex)

      if (!Number.isInteger(createdAssetId) || createdAssetId <= 0) {
        throw new Error('Could not determine created asset ID')
      }

      setMintedAssetId(createdAssetId)
      localStorage.setItem('campuspass:lastAssetId', createdAssetId.toString())
      onMint?.(createdAssetId)
      enqueueSnackbar(`Ticket NFT minted. Asset ID: ${createdAssetId}`, { variant: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ticket mint failed'
      enqueueSnackbar(message, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="campuspass-card">
      <h2>Mint Ticket NFT</h2>
      <p>Mints a real Algorand Standard Asset with total supply 1.</p>
      <input
        className="input"
        type="text"
        placeholder="Event name"
        value={eventName}
        onChange={(event) => setEventName(event.target.value)}
      />
      <input
        className="input"
        type="text"
        placeholder="Asset URL"
        value={assetUrl}
        onChange={(event) => setAssetUrl(event.target.value)}
      />
      <button className="btn" onClick={mintTicket} disabled={loading}>
        {loading ? 'Minting...' : 'Mint Event Ticket NFT'}
      </button>
      {mintedAssetId !== null && <p className="mono">Minted Asset ID: {mintedAssetId}</p>}
    </section>
  )
}
