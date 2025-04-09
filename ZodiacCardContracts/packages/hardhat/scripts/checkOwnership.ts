import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  // Get addresses from .env
  const proxyAddress = process.env.PROXY_CONTRACT_ADDRESS;
  const implementationAddress = process.env.IMPLEMENTATION_CONTRACT_ADDRESS;

  if (!proxyAddress || !implementationAddress) {
    throw new Error("PROXY_CONTRACT_ADDRESS or IMPLEMENTATION_CONTRACT_ADDRESS not set in .env");
  }

  console.log("\n📝 Contract Addresses:");
  console.log("Proxy:", proxyAddress);
  console.log("Implementation:", implementationAddress);

  // Get contract instances
  const zodaNFTProxy = await ethers.getContractAt("ZodaNFT", proxyAddress);
  const zodaNFTImplementation = await ethers.getContractAt("ZodaNFT", implementationAddress);

  // Check ownership and other details
  console.log("\n👤 Ownership Information:");
  console.log("Proxy Contract Owner:", await zodaNFTProxy.owner());
  
  try {
    const implementationOwner = await zodaNFTImplementation.owner();
    console.log("Implementation Contract Owner:", implementationOwner);
  } catch (error) {
    console.log("Implementation Contract Owner: Not accessible (expected for UUPS proxy pattern)");
  }

  // Get additional proxy contract details
  const treasuryAddress = await zodaNFTProxy.treasuryAddress();
  const mintFee = await zodaNFTProxy.mintFee();

  console.log("\n💡 Additional Contract Details:");
  console.log("Treasury Address:", treasuryAddress);
  console.log("Current Mint Fee:", ethers.formatEther(mintFee), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 