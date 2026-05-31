require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    // Local Hardhat node: run `npm run node` to start it
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Polygon Amoy testnet (replaced Mumbai in 2024)
    polygon_amoy: {
      url: process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
