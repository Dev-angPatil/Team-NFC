import algosdk from 'algosdk'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { getAlgodClient } from '../utils/algorandClients'
import { getIdentityAppId } from '../utils/campusPassConfig'

const registerMethod = algosdk.ABIMethod.fromSignature('register(string)void')

async function sha256Hex(input: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export default function RegisterIdentity() {
  const { activeAddress, transactionSigner } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const [studentId, setStudentId] = useState('')
  const [lastHash, setLastHash] = useState('')
  const [loading, setLoading] = useState(false)

  const appId = getIdentityAppId()
  const algodClient = getAlgodClient()

  if (!appId) {
    return (
      <section className="campuspass-card">
        <h2>Register Identity</h2>
        <p>Set `VITE_IDENTITY_APP_ID` to enable identity registration.</p>
      </section>
    )
  }

  const requireWallet = (): boolean => {
    if (!activeAddress || !transactionSigner) {
      enqueueSnackbar('Connect wallet first', { variant: 'warning' })
      return false
    }
    return true
  }

  const optInIdentity = async () => {
    if (!requireWallet()) return

    setLoading(true)
    try {
      const params = await algodClient.getTransactionParams().do()
      const txn = algosdk.makeApplicationOptInTxnFromObject({
        sender: activeAddress!,
        appIndex: appId,
        suggestedParams: params,
      })

      const atc = new algosdk.AtomicTransactionComposer()
      atc.addTransaction({ txn, signer: transactionSigner! })
      const result = await atc.execute(algodClient, 4)
      enqueueSnackbar(`Identity app opt-in confirmed: ${result.txIDs[0]}`, { variant: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Identity opt-in failed'
      enqueueSnackbar(message, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const registerIdentity = async () => {
    if (!requireWallet()) return
    if (!studentId.trim()) {
      enqueueSnackbar('Enter student ID', { variant: 'warning' })
      return
    }

    setLoading(true)
    try {
      const studentHash = await sha256Hex(studentId.trim())
      const params = await algodClient.getTransactionParams().do()
      const atc = new algosdk.AtomicTransactionComposer()

      atc.addMethodCall({
        appID: appId,
        method: registerMethod,
        methodArgs: [studentHash],
        sender: activeAddress!,
        suggestedParams: params,
        signer: transactionSigner!,
      })

      const result = await atc.execute(algodClient, 4)
      setLastHash(studentHash)
      enqueueSnackbar(`Identity registered: ${result.txIDs[0]}`, { variant: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Identity registration failed'
      enqueueSnackbar(message, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="campuspass-card">
      <h2>Register Identity</h2>
      <p>Opt in once, then register your student ID hash on-chain.</p>
      <input
        className="input"
        type="text"
        placeholder="Student ID"
        value={studentId}
        onChange={(event) => setStudentId(event.target.value)}
      />
      <div className="row">
        <button className="btn" onClick={optInIdentity} disabled={loading}>
          {loading ? 'Working...' : 'Opt In Identity App'}
        </button>
        <button className="btn" onClick={registerIdentity} disabled={loading}>
          {loading ? 'Working...' : 'Register Identity'}
        </button>
      </div>
      {lastHash && <p className="mono">Last hash: {lastHash}</p>}
      <p className="mono">Identity App ID: {appId}</p>
    </section>
  )
}
