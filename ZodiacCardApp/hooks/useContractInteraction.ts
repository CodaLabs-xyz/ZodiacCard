import { usePublicClient, useWalletClient } from 'wagmi'
import { type Hash, ContractFunctionExecutionError } from 'viem'

// Constants for retry mechanism
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Helper function to determine if an error is retryable
const isRetryableError = (error: any) => {
  const message = error.message?.toLowerCase() || ''
  return message.includes('timeout') || 
         message.includes('network error') || 
         message.includes('connection refused') ||
         message.includes('rate limit') ||
         message.includes('internal json-rpc error')
}

// Retry mechanism for RPC operations
const retryOperation = async (operation: () => Promise<any>, retries = MAX_RETRIES): Promise<any> => {
  try {
    return await operation()
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      console.warn(`RPC operation failed, retrying... (${retries} attempts left)`, error)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return retryOperation(operation, retries - 1)
    }
    throw error
  }
}

export function useContractInteraction() {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const writeContract = async ({ 
    address, 
    abi, 
    functionName, 
    args 
  }: { 
    address: `0x${string}`
    abi: any
    functionName: string
    args: unknown[]
  }): Promise<Hash> => {
    if (!publicClient) throw new Error('Public client not ready')
    if (!walletClient) throw new Error('Wallet not connected')

    return retryOperation(async () => {
      try {
        const { request } = await publicClient.simulateContract({
          account: walletClient.account.address,
          address,
          abi,
          functionName,
          args,
        })

        const hash = await walletClient.writeContract(request)
        return hash
      } catch (err) {
        if (err instanceof ContractFunctionExecutionError) {
          // Enhanced error messages for common contract errors
          const message = err.message.toLowerCase()
          if (message.includes('insufficient funds')) {
            throw new Error('Insufficient funds to complete the transaction')
          } else if (message.includes('user rejected')) {
            throw new Error('Transaction was rejected by the user')
          } else if (message.includes('nonce too low')) {
            throw new Error('Transaction failed due to nonce mismatch. Please try again')
          } else if (message.includes('gas required exceeds allowance')) {
            throw new Error('Transaction requires more gas than allowed. Please try again with higher gas limit')
          }
          throw new Error(`Contract execution failed: ${err.message}`)
        }
        throw err
      }
    })
  }

  const waitForTransaction = async (hash: Hash) => {
    if (!publicClient) throw new Error('Public client not ready')
    
    return retryOperation(async () => {
      try {
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        return receipt
      } catch (error) {
        if (error instanceof Error && error.message.includes('timeout')) {
          throw new Error('Transaction confirmation timed out. The transaction may still be processing')
        }
        throw error
      }
    })
  }

  return {
    writeContract,
    waitForTransaction,
  }
} 