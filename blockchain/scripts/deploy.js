const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying CertificateRegistry with account:", deployer.address);

  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = await CertificateRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("CertificateRegistry deployed to:", address);

  // Write the address + ABI to a JSON file so the frontend and backend can read it
  const artifact = {
    address,
    network: hre.network.name,
    abi: JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json"),
        "utf8"
      )
    ).abi,
  };

  const outPath = path.join(__dirname, "../deployed.json");
  fs.writeFileSync(outPath, JSON.stringify(artifact, null, 2));
  console.log("Contract info saved to blockchain/deployed.json");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
