import algosdk from 'algosdk'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { getAlgodClient } from '../utils/algorandClients'
import { getPermissionAppId } from '../utils/campusPassConfig'

const grantMethod = algosdk.ABIMethod.fromSignature('grant(address,uint64)void')
const revokeMethod = algosdk.ABIMethod.fromSignature('revoke(address)void')
const hasPermissionMethod = algosdk.ABIMethod.fromSignature('has_permission(address)bool')
const permissionPrefix = new TextEncoder().encode('perm_')

function getPermissionBoxName(account: string): Uint8Array {
  const addressBytes = algosdk.decodeAddress(account).publicKey
  const key = new Uint8Array(permissionPrefix.length + addressBytes.length)
  key.set(permissionPrefix, 0)
  key.set(addressBytes, permissionPrefix.length)
  return key
}

export default function PermissionManager() {
  const { activeAddress, transactionSigner } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const [targetAddress, setTargetAddress] = useState('')
  const [expiryTimestamp, setExpiryTimestamp] = useState('')
  const [permissionStatus, setPermissionStatus] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  const appId = getPermissionAppId()
  const algodClient = getAlgodClient()

  if (!appId) {
    return (
      <section className="campuspass-card">
        <h2>Permission Manager (Optional)</h2>
        <p>Set `VITE_PERMISSION_APP_ID` to enable admin permission controls.</p>
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

  const resolveTarget = (): string | null => {
    const normalized = (targetAddress || activeAddress || '').trim()
    if (!normalized) {
      enqueueSnackbar('Provide target wallet address', { variant: 'warning' })
      return null
    }
    try {
      algosdk.decodeAddress(normalized)
      return normalized
    } catch {
      enqueueSnackbar('Invalid Algorand address', { variant: 'warning' })
      return null
    }
  }

  const grantPermission = async () => {
    if (!requireWallet()) return
    const target = resolveTarget()
    if (!target) return

    const expiry = Number(expiryTimestamp)
    if (!Number.isInteger(expiry) || expiry <= 0) {
      enqueueSnackbar('Provide unix expiry timestamp', { variant: 'warning' })
      return
    }

    setLoading(true)
    try {
      const params = await algodClient.getTransactionParams().do()
      const atc = new algosdk.AtomicTransactionComposer()
      atc.addMethodCall({
        appID: appId,
        method: grantMethod,
        methodArgs: [target, expiry],
        sender: activeAddress!,
        suggestedParams: params,
        boxes: [{ appIndex: appId, name: getPermissionBoxName(target) }],
        signer: transactionSigner!,
      })

      const result = await atc.execute(algodClient, 4)
      enqueueSnackbar(`Permission granted: ${result.txIDs[0]}`, { variant: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Permission grant failed'
      enqueueSnackbar(message, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const revokePermission = async () => {
    if (!requireWallet()) return
    const target = resolveTarget()
    if (!target) return

    setLoading(true)
    try {
      const params = await algodClient.getTransactionParams().do()
      const atc = new algosdk.AtomicTransactionComposer()
      atc.addMethodCall({
        appID: appId,
        method: revokeMethod,
        methodArgs: [target],
        sender: activeAddress!,
        suggestedParams: params,
        boxes: [{ appIndex: appId, name: getPermissionBoxName(target) }],
        signer: transactionSigner!,
      })

      const result = await atc.execute(algodClient, 4)
      enqueueSnackbar(`Permission revoked: ${result.txIDs[0]}`, { variant: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Permission revoke failed'
      enqueueSnackbar(message, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const checkPermission = async () => {
    if (!requireWallet()) return
    const target = resolveTarget()
    if (!target) return

    setLoading(true)
    try {
      const params = await algodClient.getTransactionParams().do()
      const atc = new algosdk.AtomicTransactionComposer()
      atc.addMethodCall({
        appID: appId,
        method: hasPermissionMethod,
        methodArgs: [target],
        sender: activeAddress!,
        suggestedParams: params,
        boxes: [{ appIndex: appId, name: getPermissionBoxName(target) }],
        signer: transactionSigner!,
      })

      const result = await atc.execute(algodClient, 4)
      const returnValue = result.methodResults[0]?.returnValue
      const hasPermission = typeof returnValue === 'boolean' ? returnValue : false
      setPermissionStatus(hasPermission)
      enqueueSnackbar(`Permission check result: ${hasPermission ? 'allowed' : 'denied'}`, {
        variant: hasPermission ? 'success' : 'warning',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Permission check failed'
      enqueueSnackbar(message, { variant: 'error' })
      setPermissionStatus(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="campuspass-card">
      <h2>Permission Manager (Optional)</h2>
      <p>Only the app creator can grant/revoke permissions.</p>
      <input
        className="input"
        type="text"
        placeholder="Target wallet address (default: connected wallet)"
        value={targetAddress}
        onChange={(event) => setTargetAddress(event.target.value)}
      />
      <input
        className="input"
        type="text"
        placeholder="Expiry unix timestamp (seconds)"
        value={expiryTimestamp}
        onChange={(event) => setExpiryTimestamp(event.target.value)}
      />
      <div className="row">
        <button className="btn" onClick={grantPermission} disabled={loading}>
          Grant
        </button>
        <button className="btn" onClick={revokePermission} disabled={loading}>
          Revoke
        </button>
        <button className="btn" onClick={checkPermission} disabled={loading}>
          Check
        </button>
      </div>
      {permissionStatus !== null && <p className="mono">Permission: {permissionStatus ? 'active' : 'inactive'}</p>}
      <p className="mono">Permission App ID: {appId}</p>
    </section>
  )
}
