# CampusPass Web3 on Algorand Testnet

CampusPass is a full-stack Algorand dApp built from the AlgoKit QuickStart workspace.

It includes:
- Wallet connect (Pera/Defly/Exodus on Testnet)
- Student identity registration (on-chain local state)
- Event ticket minting as real Algorand Standard Asset NFTs (ASA supply 1)
- Entry verification via Algorand Indexer (NFT ownership check)
- Optional admin permission management (grant/revoke/check with expiry)

## Project Structure

- `projects/NFC-contracts`: Algorand smart contracts and deployment scripts
- `projects/NFC-frontend`: React frontend (Vite + use-wallet + algosdk)

## Implemented Contracts

- `projects/NFC-contracts/smart_contracts/identity/contract.py`
  - `opt_in` (bare OptIn)
  - `register(string)` stores hashed student ID in local state
  - `get_registered_hash(address)` readonly getter
- `projects/NFC-contracts/smart_contracts/permission/contract.py`
  - `grant(address,uint64)` admin-only
  - `revoke(address)` admin-only
  - `has_permission(address)` readonly check against expiry timestamp

Deploy configs:
- `projects/NFC-contracts/smart_contracts/identity/deploy_config.py`
- `projects/NFC-contracts/smart_contracts/permission/deploy_config.py`

Deployment metadata helper:
- `projects/NFC-contracts/smart_contracts/_deployment.py`
  - Writes app IDs to `projects/NFC-contracts/smart_contracts/deployments/<network>.json`
  - Updates frontend runtime env in `projects/NFC-frontend/.env.local`

## Implemented Frontend Components

- `projects/NFC-frontend/src/components/RegisterIdentity.tsx`
- `projects/NFC-frontend/src/components/MintTicket.tsx`
- `projects/NFC-frontend/src/components/VerifyEntry.tsx`
- `projects/NFC-frontend/src/components/PermissionManager.tsx`

Integrated in:
- `projects/NFC-frontend/src/App.tsx`

## Environment Setup (Testnet)

### 1) Contracts env

```bash
cd projects/NFC-contracts
cp .env.template .env
```

Edit `projects/NFC-contracts/.env` and set:
- `DEPLOYER_MNEMONIC="your 25-word mnemonic"`
- Testnet algod/indexer endpoints are already set in template

### 2) Frontend env

```bash
cd ../NFC-frontend
cp .env.template .env
```

After contract deployment, set:
- `VITE_IDENTITY_APP_ID`
- `VITE_PERMISSION_APP_ID` (optional if permission contract deployed)
- `VITE_DEFAULT_EVENT_ASSET_ID` (optional)

## Wallet Setup (Pera + Testnet Funding)

1. Install Pera Wallet.
2. Create/import a Testnet account.
3. Fund account with Testnet ALGOs from AlgoKit dispenser/faucet.
4. Use this funded account in the frontend wallet modal.
5. Use a deployer mnemonic in `projects/NFC-contracts/.env` for contract deployment.

## Build and Run

### Bootstrap and build workspace

```bash
cd /path/to/NFC
algokit project bootstrap all
algokit project run build
```

### Deploy contracts to Testnet

```bash
algokit project deploy testnet
```

On successful deployment, app IDs are written to:
- `projects/NFC-contracts/smart_contracts/deployments/testnet.json`
- `projects/NFC-frontend/.env.local`

### Run frontend

```bash
cd projects/NFC-frontend
pnpm install
pnpm dev
```

Open:
- `http://localhost:5173/`

## Deployment Records

Fill these after successful Testnet deploy/mint:

- Identity App ID: `TBD`
- Permission App ID: `TBD`
- Event Ticket Asset ID(s): `TBD`

## Notes on Real Transactions

- Identity registration uses real app opt-in + app call transactions.
- Ticket minting uses real `algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject` transactions.
- Permission manager uses real app ABI method calls with box references.
- Entry verification checks real indexer holdings for the selected NFT asset ID.
