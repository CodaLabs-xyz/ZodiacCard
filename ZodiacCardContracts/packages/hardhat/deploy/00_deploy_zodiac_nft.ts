import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const deployZodiacNFT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Get required addresses from environment variables
  const ownerAddress = process.env.DEPLOYER_ADDRESS;
  const treasuryAddress = process.env.TREASURY_ADDRESS;
  const usdcAddress = process.env.USDC_CONTRACT_ADDRESS;
  const mintFeeUSDC = process.env.USDC_MINT_FEE;

  if (!ownerAddress || !treasuryAddress || !usdcAddress || !mintFeeUSDC) {
    throw new Error("Required environment variables not set (DEPLOYER_ADDRESS, TREASURY_ADDRESS, USDC_CONTRACT_ADDRESS, USDC_MINT_FEE)");
  }

  console.log("\n👤 Using owner address:", ownerAddress);
  console.log("💰 Using treasury address:", treasuryAddress);
  console.log("💵 Using USDC address:", usdcAddress);

  // Configuration for different networks
  const config = {
    name: "Zodiac NFT",
    symbol: "ZODIAC",
    // $0.5 USDC (6 decimals)
    mintFee: ethers.parseUnits(mintFeeUSDC, 6),
  };

  console.log("\n📝 Deployment Configuration:");
  console.log("- Name:", config.name);
  console.log("- Symbol:", config.symbol);
  console.log("- Mint Fee:", ethers.formatUnits(config.mintFee, 6), "USDC");

  // Deploy implementation
  console.log("\n🚀 Deploying ZodiacNFT...");
  const zodiacNFTDeployment = await deploy("ZodiacNFT", {
    from: deployer,
    proxy: {
      proxyContract: "UUPS",
      execute: {
        init: {
          methodName: "initialize",
          args: [
            config.name,
            config.symbol,
            config.mintFee,
            ownerAddress, // Contract owner
            treasuryAddress, // Treasury address for fee collection
            usdcAddress, // USDC token address
          ],
        },
      },
    },
    log: true,
    autoMine: true,
  });

  // Verify the implementation contract if we're on a live network
  if (
    !hre.network.tags.local &&
    process.env.ETHERSCAN_API_KEY &&
    process.env.VERIFY_ON_DEPLOY
  ) {
    console.log("\n🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: zodiacNFTDeployment.implementation,
        constructorArguments: [],
      });
      console.log("✅ Implementation contract verified");
    } catch (error) {
      console.log("❌ Error verifying implementation contract:", error);
    }
  }

  // Get the deployed contract instance
  const zodiacNFT = await ethers.getContractAt("ZodiacNFT", zodiacNFTDeployment.address);

  // Verify contract settings are correct
  const contractOwner = await zodiacNFT.owner();
  const contractTreasury = await zodiacNFT.treasuryAddress();
  const contractUSDC = await zodiacNFT.usdcToken();
  const contractMintFee = await zodiacNFT.mintFee();

  // Verify all settings
  if (contractOwner.toLowerCase() !== ownerAddress.toLowerCase()) {
    throw new Error(`Owner not set correctly. Expected ${ownerAddress}, got ${contractOwner}`);
  }

  if (contractTreasury.toLowerCase() !== treasuryAddress.toLowerCase()) {
    throw new Error(`Treasury not set correctly. Expected ${treasuryAddress}, got ${contractTreasury}`);
  }

  if (contractUSDC.toLowerCase() !== usdcAddress.toLowerCase()) {
    throw new Error(`USDC address not set correctly. Expected ${usdcAddress}, got ${contractUSDC}`);
  }

  if (contractMintFee !== config.mintFee) {
    throw new Error(`Mint fee not set correctly. Expected ${config.mintFee}, got ${contractMintFee}`);
  }

  // Log deployment info
  console.log("\n📝 ZodiacNFT Contract Info:");
  console.log("⚡️ Proxy Address:", zodiacNFTDeployment.address);
  console.log("⚡️ Implementation Address:", zodiacNFTDeployment.implementation);
  console.log("⚡️ Owner:", contractOwner);
  console.log("⚡️ Treasury:", contractTreasury);
  console.log("⚡️ USDC Token:", contractUSDC);
  console.log("⚡️ Mint Fee:", ethers.formatUnits(contractMintFee, 6), "USDC");

  console.log("\n💰 Current mint fee:", ethers.formatUnits(contractMintFee, 6), "USDC");
  console.log("💰 New mint fee:", ethers.formatUnits(config.mintFee, 6), "USDC");

  console.log("\n✅ Deployment completed successfully!");
};

export default deployZodiacNFT;

// Tags are useful for partial deployments
deployZodiacNFT.tags = ["ZodiacNFT"];
deployZodiacNFT.dependencies = []; 