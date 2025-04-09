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

  console.log("\n📊 Contract Information:");
  console.log("Contract Address:", proxyAddress);

  // Get contract balance
  const contractBalance = await ethers.provider.getBalance(proxyAddress);
  console.log("\n💰 Contract Balance:", ethers.formatEther(contractBalance), "ETH");

  // Get treasury address and balance
  const treasuryAddress = await zodaNFT.treasuryAddress();
  const treasuryBalance = await ethers.provider.getBalance(treasuryAddress);
  
  console.log("\n🏦 Treasury Information:");
  console.log("Treasury Address:", treasuryAddress);
  console.log("Treasury Balance:", ethers.formatEther(treasuryBalance), "ETH");

  // Get mint fee
  const mintFee = await zodaNFT.mintFee();
  console.log("\n💵 Mint Fee:", ethers.formatEther(mintFee), "ETH");

  // Calculate number of possible mints in contract
  if (contractBalance > 0n) {
    const possibleMints = contractBalance / mintFee;
    console.log("\n📈 Contract Balance Analysis:");
    console.log(`This balance is equivalent to ${possibleMints} mint fees`);
    
    if (contractBalance >= ethers.parseEther("0.01")) {
      console.log("\n⚠️ Note: Contract balance is over 0.01 ETH threshold for auto-withdrawal");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 