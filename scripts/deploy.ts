import { ethers, run } from "hardhat";
import * as dotenv from "dotenv";
import { Lottery__factory } from "../typechain-types";
dotenv.config();

const TOKEN_RATIO = 2;
const BET_PRICE = 0.8;
const BET_FEE = 0.2;

const main = async () => {
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY ?? "");
  console.log(`Using wallet address ${wallet.address}`);

  const provider = new ethers.providers.JsonRpcProvider(
    process.env.ALCHEMY_HTTPS
  );
  const lastBlock = await provider.getBlock("latest");
  console.log(`The latest block is ${lastBlock.number}`);

  const signer = wallet.connect(provider);
  const balance = await signer.getBalance();
  console.log(`Balance is ${balance} WEI`);

  console.log("Deploying Lottery Contract");

  const lotteryContractFactory = new Lottery__factory(signer);

  const lotteryContract = await lotteryContractFactory.deploy(
    "Lottery Token",
    "LT0",
    TOKEN_RATIO,
    ethers.utils.parseEther(BET_PRICE.toString()),
    ethers.utils.parseEther(BET_FEE.toString())
  );

  const deployTX = await lotteryContract.deployTransaction.wait();

  console.log(
    `Lottery Contract deployed at address: ${lotteryContract.address}, with the following txHash: ${deployTX.transactionHash}`
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
