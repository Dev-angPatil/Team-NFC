import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useEffect, useState } from 'react'
import { getIndexerClient } from '../utils/algorandClients'
import { getDefaultEventAssetId } from '../utils/campusPassConfig'

interface VerifyEntryProps {
  initialAssetId?: number | null
}

export default function VerifyEntry({ initialAssetId = null }: VerifyEntryProps) {
  const { activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const fallbackAssetId = getDefaultEventAssetId()
  const [assetIdInput, setAssetIdInput] = useState(
    (initialAssetId ?? fallbackAssetId ?? null)?.toString() ?? localStorage.getItem('campuspass:lastAssetId') ?? '',
  )
  const [ownsTicket, setOwnsTicket] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  const indexerClient = getIndexerClient()

  useEffect(() => {
    if (initialAssetId) {
      setAssetIdInput(initialAssetId.toString())
    }
  }, [initialAssetId])

  const verifyOwnership = async () => {
    if (!activeAddress) {
      enqueueSnackbar('Connect wallet first', { variant: 'warning' })
      return
    }

    const assetId = Number(assetIdInput.trim())
    if (!Number.isInteger(assetId) || assetId <= 0) {
      enqueueSnackbar('Enter a valid Asset ID', { variant: 'warning' })
      return
    }

    setLoading(true)
    try {
      const response = await indexerClient.lookupAccountAssets(activeAddress).assetId(assetId).do()
      const holdings = response.assets ?? []
      const amountValue = holdings.length > 0 ? Number(holdings[0].amount) : 0
      const hasTicket = Number.isFinite(amountValue) && amountValue > 0
      setOwnsTicket(hasTicket)

      if (hasTicket) {
        enqueueSnackbar('Entry verified: wallet owns this NFT', { variant: 'success' })
      } else {
        enqueueSnackbar('Entry denied: wallet does not own this NFT', { variant: 'error' })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ownership verification failed'
      enqueueSnackbar(message, { variant: 'error' })
      setOwnsTicket(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="campuspass-card">
      <h2>Verify Entry</h2>
      <p>Checks current wallet ownership of the event NFT via Algorand Indexer.</p>
      <input
        className="input"
        type="text"
        placeholder="Asset ID"
        value={assetIdInput}
        onChange={(event) => setAssetIdInput(event.target.value)}
      />
      <button className="btn" onClick={verifyOwnership} disabled={loading}>
        {loading ? 'Verifying...' : 'Verify NFT Ownership'}
      </button>
      {ownsTicket !== null && (
        <p className="mono">Result: {ownsTicket ? 'Valid ticket holder' : 'No ticket found for this wallet'}</p>
      )}
    </section>
  )
}
