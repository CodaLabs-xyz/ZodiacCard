import * as dotenv from "dotenv";
dotenv.config();
import { ethers, Wallet } from "ethers";
import QRCode from "qrcode";
import { config } from "hardhat";
import password from "@inquirer/password";

async function main() {
  const encryptedKey = process.env.DEPLOYER_PRIVATE_KEY_ENCRYPTED;

  if (!encryptedKey) {
    console.log("🚫️ You don't have a deployer account. Run `yarn generate` or `yarn account:import` first");
    return;
  }

  const pass = await password({ message: "Enter your password to decrypt the private key:" });
  let wallet: Wallet;
  try {
    wallet = (await Wallet.fromEncryptedJson(encryptedKey, pass)) as Wallet;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    console.log("❌ Failed to decrypt private key. Wrong password?");
    return;
  }

  const address = wallet.address;
  console.log(await QRCode.toString(address, { type: "terminal", small: true }));
  console.log("Public address:", address);
  
  // Check if address matches DEPLOYER_ADDRESS
  const deployerAddress = process.env.DEPLOYER_ADDRESS;
  if (deployerAddress && deployerAddress.toLowerCase() !== address.toLowerCase()) {
    console.log("\n⚠️ Warning: This address does not match DEPLOYER_ADDRESS in .env!");
    console.log("Current DEPLOYER_ADDRESS:", deployerAddress);
  }

  // Show treasury address if set
  const treasuryAddress = process.env.TREASURY_ADDRESS;
  if (treasuryAddress) {
    console.log("\n💰 Treasury address:", treasuryAddress);
  } else {
    console.log("\n💡 No TREASURY_ADDRESS set, fees will go to deployer address");
  }

  // Balance on each network
  console.log("\nNetwork Balances:")
  const availableNetworks = config.networks;
  for (const networkName in availableNetworks) {
    try {
      const network = availableNetworks[networkName];
      if (!("url" in network)) continue;
      const provider = new ethers.JsonRpcProvider(network.url);
      await provider._detectNetwork();
      const balance = await provider.getBalance(address);
      console.log("--", networkName, "-- 📡");
      console.log("   balance:", +ethers.formatEther(balance));
      console.log("   nonce:", +(await provider.getTransactionCount(address)));

      // Show treasury balance if set
      if (treasuryAddress) {
        const treasuryBalance = await provider.getBalance(treasuryAddress);
        console.log("   treasury balance:", +ethers.formatEther(treasuryBalance));
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      console.log("Can't connect to network", networkName);
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
