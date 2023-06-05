import { expect, should } from "chai";
import { ContractFactory } from "ethers";
import { ethers } from "hardhat";
import { Lottery, LotteryToken, Lottery__factory } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Block } from "@ethersproject/providers";

describe("Lottery Dapp", async () => {
  const TOKEN_RATIO = 1;
  const BET_PRICE = 0.8;
  const BET_FEE = 0.2;

  let contract: Lottery;
  let token: LotteryToken;
  let accounts: SignerWithAddress[];
  let currentTimestamp: number;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    const contractFactory = new Lottery__factory(accounts[0]);
    contract = await contractFactory.deploy(
      "Lottery Token",
      "LT0",
      TOKEN_RATIO,
      ethers.utils.parseEther(BET_PRICE.toFixed(18)),
      ethers.utils.parseEther(BET_FEE.toFixed(18))
    );
  });

  describe("development", function () {
    beforeEach(async () => {
      currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
    });
    describe("open bets", async () => {
      it("ensures that only owner can open bets", async () => {
        await expect(
          contract
            .connect(accounts[1])
            .openBets(currentTimestamp + Number(1 * 60))
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
      it("ensures there is no other running lottery", async () => {
        await contract.openBets(currentTimestamp + Number(1 * 60));
        let flag: boolean = await contract.betsOpen();
        if (flag)
          await expect(
            contract.openBets(currentTimestamp + Number(1 * 60))
          ).to.be.revertedWith("Lottery is open");
      });
      it("end timestamp cannot be in the past", async () => {
        await expect(
          contract.openBets(currentTimestamp - Number(1 * 60))
        ).to.be.revertedWith("End time must be in the future");
      });
      it("updates betClosing time variable", async () => {
        // starting a lottery should update the betsClosingTime timestamp to not be 0;
        await contract.openBets(currentTimestamp + Number(1 * 60));
        let closingTime = await contract.betsClosingTime();
        await expect(closingTime).to.be.gt(0);
      });
      it("updates betsOpen flag", async () => {
        // starting a lottery should cause the betsOpen flag to evaluate to true.
        await contract.openBets(currentTimestamp + Number(1 * 60));
        let flag = await contract.betsOpen();
        await expect(flag).to.be.eq(true);
      });
    });

    describe("Purchase Tokens", function () {
      it("purchase token", async () => {});
    });

    it("bet", async () => {});
    it("Bet many", async () => {});
    it("closeLottery", async () => {});
    it("getRando", async () => {});
    it("prize withdraw??", async () => {});
    it("ownerWithdraw", async () => {});
    it("returnTokens", async () => {});
  });

  describe("deployment", function () {
    it("Should Implement ownable", async () => {
      // transferOwnership / renounceOwnership
      throw new Error("Not implemented");
    });
    it("Should Only Allow The Owner To deploy lottery and define betting price and fee", async () => {
      //'Ownable: caller is not the owner',
      throw new Error("Not implemented");
    });
    it("Should Require That Only Owner start lottery", async () => {
      // "Ownable: caller is not the owner",
      it("Should require a block timestamp target", async () => {
        throw new Error("Not implemented");
      });
    });
  });

  describe("Outside Of Betting Window", function () {
    it("Players must buy an ERC20 with ETH", async () => {
      throw new Error("Not implemented");
    });
    it("Players pay ERC20 to bet", async () => {
      it("Only possible before block timestamp met", async () => {
        throw new Error("Not implemented");
      });
    });
    it("Anyone can roll the lottery", async () => {
      it("Only after block timestamp target is met", async () => {});
      it("Randomness from RANDAO", async () => {});
    });
  });

  describe("During Betting Window", function () {});
  describe("After Completion of Lottery", function () {
    it("Winner receives the pooled ERC20 minus fee", async () => {
      throw new Error("Not implemented");
    });
    it("Owner can withdraw fees and restart lottery", async () => {
      throw new Error("Not implemented");
    });
    it("Players can burn ERC20 tokens and redeem ETH", async () => {
      throw new Error("Not implemented");
    });
  });
});
