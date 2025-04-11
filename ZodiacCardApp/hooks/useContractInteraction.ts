import { usePublicClient, useWalletClient } from 'wagmi'
import { type Hash, ContractFunctionExecutionError } from 'viem'

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
        throw new Error(`Contract execution failed: ${err.message}`)
      }
      throw err
    }
  }

  const waitForTransaction = async (hash: Hash) => {
    if (!publicClient) throw new Error('Public client not ready')
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    return receipt
  }

  return {
    writeContract,
    waitForTransaction,
  }
} 