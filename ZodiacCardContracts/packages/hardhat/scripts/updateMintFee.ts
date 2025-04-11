import { ethers, network } from "hardhat"

async function main() {
    // Ensure we're on Base Sepolia
    if (network.name !== "baseSepolia") {
        throw new Error("This script must be run on Base Sepolia network")
    }
    console.log("🌍 Network:", network.name)

    // Get owner private key from .env
    const ownerPrivateKey = process.env.OWNER_ADDRESS_PRIVATE_KEY
    if (!ownerPrivateKey) {
        throw new Error("OWNER_ADDRESS_PRIVATE_KEY not set in .env")
    }

    // Get proxy address from .env
    const proxyAddress = process.env.PROXY_CONTRACT_ADDRESS
    if (!proxyAddress) {
        throw new Error("PROXY_CONTRACT_ADDRESS not set in .env")
    }

    // Get mint fee from .env and convert to USDC decimals (6)
    const mintFeeUSDC = process.env.USDC_MINT_FEE
    if (!mintFeeUSDC) {
        throw new Error("USDC_MINT_FEE not set in .env")
    }

    // Create a wallet instance
    const provider = ethers.provider
    const wallet = new ethers.Wallet(ownerPrivateKey, provider)
    console.log("🔑 Using address:", wallet.address)

    // Convert the fee to USDC decimals (6)
    const newMintFee = ethers.parseUnits(mintFeeUSDC, 6)

    // Get contract instance connected to owner wallet
    const zodiacNFT = await ethers.getContractAt("ZodiacNFT", proxyAddress, wallet)

    // Get current mint fee for comparison
    const currentMintFee = await zodiacNFT.mintFee()
    console.log("\n💰 Current mint fee:", ethers.formatUnits(currentMintFee, 6), "USDC")
    console.log("💰 New mint fee:", ethers.formatUnits(newMintFee, 6), "USDC")

    // Check if wallet is owner
    const owner = await zodiacNFT.owner()
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
        throw new Error(`Signer is not the contract owner. Owner is ${owner}`)
    }

    // Check if the fee is actually different
    if (currentMintFee === newMintFee) {
        console.log("\n⚠️ New fee is the same as current fee. No update needed.")
        return
    }

    try {
        console.log("\n🚀 Updating mint fee on Base Sepolia...")
        const tx = await zodiacNFT.setMintFee(newMintFee)
        console.log("⏳ Transaction hash:", tx.hash)
        console.log(`📍 View on Explorer: https://sepolia.basescan.org/tx/${tx.hash}`)
        console.log("Waiting for confirmation...")

        // Wait for transaction confirmation with 2 blocks for Base Sepolia
        const receipt = await tx.wait(2)
        if (!receipt) throw new Error("Transaction failed")
        
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber)
        console.log(`📍 Block Explorer: https://sepolia.basescan.org/block/${receipt.blockNumber}`)

        // Verify the new fee
        const updatedMintFee = await zodiacNFT.mintFee()
        console.log("\n✅ New mint fee verified:", ethers.formatUnits(updatedMintFee, 6), "USDC")

    } catch (error) {
        console.error("❌ Error updating mint fee:", error)
        throw error
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    }) 