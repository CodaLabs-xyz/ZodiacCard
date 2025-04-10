import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { EventLog } from "ethers";
import { uploadJsonToPinata } from "./utils/pinata";
dotenv.config();

async function main() {
    // Get addresses from .env
    const proxyAddress = process.env.PROXY_CONTRACT_ADDRESS;
    const usdcAddress = process.env.USDC_CONTRACT_ADDRESS;
    
    if (!proxyAddress || !usdcAddress) {
        throw new Error("PROXY_CONTRACT_ADDRESS or USDC_CONTRACT_ADDRESS not set in .env");
    }

    // Get contract instances
    const zodiacNFT = await ethers.getContractAt("ZodiacNFT", proxyAddress);
    const usdcToken = await ethers.getContractAt("IERC20", usdcAddress);

    // Get the mint fee
    const mintFee = await zodiacNFT.mintFee();
    console.log("\n💰 Current mint fee:", ethers.formatUnits(mintFee, 6), "USDC");

    // Get signer
    const [signer] = await ethers.getSigners();
    const signerAddress = await signer.getAddress();
    console.log("🔑 Minting from address:", signerAddress);

    // Check USDC balance
    const usdcBalance = await usdcToken.balanceOf(signerAddress);
    console.log("💳 USDC balance:", ethers.formatUnits(usdcBalance, 6), "USDC");

    // Check if we have enough USDC
    if (usdcBalance < mintFee) {
        throw new Error(`Insufficient USDC balance. Need ${ethers.formatUnits(mintFee, 6)} USDC but have ${ethers.formatUnits(usdcBalance, 6)} USDC`);
    }

    try {
        // Get next token ID for naming
        const nextTokenId = await zodiacNFT.nextTokenId?.() || "1";

        // Prepare metadata for this specific NFT
        const metadata = {
            name: `Zodiac NFT #${nextTokenId}`,
            description: "A unique Zodiac NFT on Base network",
            image: "https://ipfs.io/ipfs/bafybeia43qxgcy6jg6p5ofyxzoonsvuytf4baqczpqlvc3mo73s2izqk3q",
            external_url: "https://zodiac.app",
            attributes: [
                {
                    trait_type: "Collection",
                    value: "Zodiac"
                }
            ]
        };

        // Upload metadata to IPFS
        console.log("\n📤 Uploading metadata to IPFS...");
        const metadataHash = await uploadJsonToPinata(metadata);
        // Use ipfs.io gateway URL for better compatibility
        const metadataURI = `https://ipfs.io/ipfs/${metadataHash}`;
        console.log("✅ Metadata uploaded! URI:", metadataURI);

        // First approve USDC spending
        console.log("\n🔓 Approving USDC spending...");
        const approveTx = await usdcToken.approve(proxyAddress, mintFee);
        console.log("⏳ Approval transaction hash:", approveTx.hash);
        await approveTx.wait();
        console.log("✅ USDC approved for spending");

        console.log("\n🚀 Attempting to mint NFT...");

        // Mint NFT with metadata
        const tx = await zodiacNFT.mint(
            signerAddress, // mint to the same address
            metadataURI // metadata URI
        );

        console.log("⏳ Transaction hash:", tx.hash);
        console.log("Waiting for confirmation...");

        // Wait for transaction confirmation
        const receipt = await tx.wait();
        if (!receipt) throw new Error("Transaction failed");
        
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

        // Get the token ID from the event
        const mintEvent = receipt.logs.find((log: unknown): log is EventLog => {
            return log instanceof EventLog && log.fragment.name === "NFTMinted";
        });

        if (mintEvent) {
            const tokenId = mintEvent.args[1]; // tokenId is the second argument in the event
            console.log("\n🎉 Success! Minted token ID:", tokenId.toString());

            // Get token URI to verify metadata
            const tokenURI = await zodiacNFT.tokenURI(tokenId);
            console.log(" Token URI:", tokenURI);
            console.log("📝 Metadata URL:", metadataURI);

            // Verify ownership
            const owner = await zodiacNFT.ownerOf(tokenId);
            console.log("👤 Token owner:", owner);

            // Log verification steps
            console.log("\n🔍 Verification Steps:");
            console.log("1. View on Block Explorer:");
            console.log(`   https://sepolia.basescan.org/token/${proxyAddress}?a=${tokenId}`);
            console.log("2. View Metadata directly:");
            console.log(`   ${metadataURI}`);
            console.log("3. Alternative IPFS Gateway:");
            console.log(`   https://gateway.pinata.cloud/ipfs/${metadataHash}`);

            // Check remaining USDC balance
            const remainingBalance = await usdcToken.balanceOf(signerAddress);
            console.log("\n💰 Remaining USDC balance:", ethers.formatUnits(remainingBalance, 6), "USDC");
        }

    } catch (error: any) {
        console.error("\n❌ Error occurred:");
        if (error.data) {
            // If it's a contract error
            console.error("Contract error message:", error.data.message);
        } else {
            // If it's a transaction error
            console.error(error.message);
        }
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 