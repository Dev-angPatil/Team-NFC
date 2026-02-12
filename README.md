# CampusPass — Smart Decentralized College ID on Algorand
CampusPass is a full-stack Web3 application built on **Algorand Testnet** using the AlgoKit QuickStart workspace.

It demonstrates how blockchain can power a digital campus identity system by combining:
* On-chain student identity registration
* NFT-based event tickets (Algorand Standard Assets)
* Real-time entry verification
* Optional permission-based access control
This project is not a generic NFT demo. It is designed as a proof-of-concept for a decentralized campus identity and event management system.

# Concept Overview
CampusPass transforms a wallet address into a digital student identity.
The system has three logical layers:
## 1. Identity Layer
Students connect their wallet and register their student ID.
The hashed student ID is stored in local state inside a smart contract on Algorand.
This establishes:

* Wallet ↔ Student identity binding
* Tamper-resistant on-chain registration
* Verifiable student authenticity

## 2. Ticket Layer (NFT as Event Credential)

Event tickets are minted as real Algorand Standard Assets (ASA).
Each ticket:
* Has supply = 1
* Is owned by the student wallet
* Contains event metadata
The NFT becomes a blockchain-based access credential.

## 3. Verification Layer
Entry verification checks:
* Does the wallet own the required ticket NFT?
* Is permission valid (if permission contract is enabled)?
Verification is performed using the Algorand Indexer.

# Tech Stack
* Algorand Testnet
* AlgoKit Workspace
* PyTeal (Smart Contracts)
* React + Vite (Frontend)
* TypeScript
* algosdk
* use-wallet (Wallet connection)
* Pera Wallet (Testnet)

# Project Structure
```
projects/
│
├── NFC-contracts/
│   └── smart_contracts/
│       ├── identity/
│       │   ├── contract.py
│       │   └── deploy_config.py
│       │
│       ├── permission/
│       │   ├── contract.py
│       │   └── deploy_config.py
│       │
│       └── _deployment.py
│
└── NFC-frontend/
    └── src/
        ├── components/
        │   ├── RegisterIdentity.tsx
        │   ├── MintTicket.tsx
        │   ├── VerifyEntry.tsx
        │   └── PermissionManager.tsx
        │
        └── App.tsx
```
# Smart Contracts Explained
## Identity Contract
Location:
```
projects/NFC-contracts/smart_contracts/identity/contract.py
```
Purpose:
Stores student identity in local state.
Key methods:
* opt_in → Allows wallet to opt into contract.
* register(string) → Stores hashed student ID.
* get_registered_hash(address) → Read-only method to fetch stored hash.
How it works:
* Student opts into the application.
* Student calls register.
* Contract writes:

  * local_state["student_hash"]

This creates a permanent on-chain identity binding.

---
# Frontend Explained

Location:
```
projects/NFC-frontend/
```
The frontend is a React + Vite application that interacts with Algorand via algosdk.
---
## RegisterIdentity.tsx
* Connects wallet
* Opts into identity contract
* Calls register method
* Shows transaction status

Uses real application call transactions.

---

## MintTicket.tsx

Creates an Algorand Standard Asset using:
```
algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject()
```
Ticket parameters:

* total: 1
* decimals: 0
* unitName: EVT
* assetName: Event Name
This creates a real NFT on Algorand Testnet.

---

## VerifyEntry.tsx

Uses Algorand Indexer to:

* Fetch account holdings
* Check if wallet owns event asset ID
If yes → Access Granted
If no → Access Denied
This mimics real entry gate validation.
---

## PermissionManager.tsx
Admin-only panel that:
* Grants permission with expiry timestamp
* Revokes permission
* Checks permission status
Uses ABI method calls to permission contract.
---

# Deployment Flow

## 1. Configure Contracts
```
cd projects/NFC-contracts
cp .env.template .env
```
Set:
```
DEPLOYER_MNEMONIC="your 25-word mnemonic"
```
---
## 2. Deploy to Testnet
```
algokit project deploy testnet
```
App IDs are written to:
```
smart_contracts/deployments/testnet.json
projects/NFC-frontend/.env.local
```
---
## 3. Run Frontend
```
cd projects/NFC-frontend
pnpm install
pnpm dev
```
Open:

```
http://localhost:5173
```

# Real Blockchain Interactions
This project uses real Testnet transactions:
* Identity registration → App opt-in + app call
* NFT minting → Asset creation transaction
* Permission management → ABI method calls
* Verification → Indexer account asset lookup
There are no mocked blockchain calls.


# Deployment Records
Fill after deployment:
* Identity App ID:
* Permission App ID:
* Event Ticket Asset ID(s):


# Why This Matters
CampusPass demonstrates how blockchain can:
* Replace physical student ID cards
* Issue tamper-proof event tickets
* Enable decentralized verification
* Reduce reliance on centralized campus systems
This project is a functional proof-of-concept for decentralized campus identity infrastructure.
