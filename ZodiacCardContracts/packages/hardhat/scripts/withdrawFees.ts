import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  // Get proxy address from .env
  const proxyAddress = process.env.PROXY_CONTRACT_ADDRESS;
  if (!proxyAddress) {
    throw new Error("PROXY_CONTRACT_ADDRESS not set in .env");
  }

  // Get contract instance
  const zodaNFT = await ethers.getContractAt("ZodaNFT", proxyAddress);

  // Get contract balance
  const contractBalance = await ethers.provider.getBalance(proxyAddress);
  console.log("\n💰 Contract balance:", ethers.formatEther(contractBalance), "ETH");

  // Get treasury address
  const treasuryAddress = await zodaNFT.treasuryAddress();
  console.log("🏦 Treasury address:", treasuryAddress);

  // Get treasury balance before withdrawal
  const treasuryBalanceBefore = await ethers.provider.getBalance(treasuryAddress);
  console.log("💳 Treasury balance before:", ethers.formatEther(treasuryBalanceBefore), "ETH");

  if (contractBalance <= 0n) {
    console.log("\n⚠️ No funds to withdraw");
    process.exit(0);
  }

  try {
    console.log("\n🚀 Attempting to withdraw fees...");
    
    // Call withdrawFees function
    const tx = await zodaNFT.withdrawFees();
    console.log("⏳ Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    if (!receipt) throw new Error("Transaction failed");
    
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

    // Get treasury balance after withdrawal
    const treasuryBalanceAfter = await ethers.provider.getBalance(treasuryAddress);
    const withdrawn = treasuryBalanceAfter - treasuryBalanceBefore;
    
    console.log("\n🎉 Withdrawal successful!");
    console.log("💰 Amount withdrawn:", ethers.formatEther(withdrawn), "ETH");
    console.log("💳 Treasury balance after:", ethers.formatEther(treasuryBalanceAfter), "ETH");

    // Verify contract balance is 0
    const contractBalanceAfter = await ethers.provider.getBalance(proxyAddress);
    console.log("📊 Contract balance after:", ethers.formatEther(contractBalanceAfter), "ETH");

  } catch (error: any) {
    console.error("\n❌ Withdrawal failed:");
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