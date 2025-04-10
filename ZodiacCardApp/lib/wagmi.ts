import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { farcasterFrame as miniAppConnector } from '@farcaster/frame-wagmi-connector'
import { injected, walletConnect } from 'wagmi/connectors'

// Get chain configuration from environment variables
const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532")

// Select the appropriate chain based on the chain ID
const chain = TARGET_CHAIN_ID === 8453 ? base : baseSepolia

// Create transports object with proper typing for both chains
const transports = {
  [base.id]: http(),
  [baseSepolia.id]: http(),
} as const

// WalletConnect project ID is required for WalletConnect v2
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not defined')
}

export const config = createConfig({
  chains: [chain],
  transports,
  connectors: [
    miniAppConnector(),
    injected(),
    walletConnect({ projectId }),
  ]
}) 