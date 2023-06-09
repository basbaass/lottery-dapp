import { expect, should } from "chai";
import { ContractFactory } from "ethers";
import { ethers } from "hardhat";
import {
  Lottery,
  LotteryToken,
  LotteryToken__factory,
  Lottery__factory,
} from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { Block } from "@ethersproject/providers";
import { parseEther } from "ethers/lib/utils";

describe("Lottery Dapp", async () => {
  const TOKEN_RATIO = 1;
  const MINT_AMOUNT = 2;
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
      ethers.utils.parseEther(BET_PRICE.toString()),
      ethers.utils.parseEther(BET_FEE.toString())
    );

    const tokenAddress = await contract.paymentToken();
    token = LotteryToken__factory.connect(tokenAddress, accounts[0]);
  });

  describe("development", function () {
    beforeEach(async () => {
      currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
    });
    describe("openBets", async () => {
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

    describe("purchaseTokens", function () {
      it("Mints the correct amount of tokens", async () => {
        await contract.purchaseTokens({ value: ethers.utils.parseEther("2") });
        let tokenBalance = await token.balanceOf(accounts[0].address);
        const expectedTokens = MINT_AMOUNT * TOKEN_RATIO;
        expect(tokenBalance).to.be.eq(
          ethers.utils.parseUnits(expectedTokens.toString())
        );
      });
      it("Requires ETH as form of payment", async () => {
        await expect(contract.purchaseTokens()).to.be.revertedWith(
          "Ether is required to purchase tokens, try again by providing Ether"
        );
      });
    });

    describe("bet", () => {
      beforeEach(async () => {
        currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
        await contract.openBets(currentTimestamp + Number(1 * 60));
        await contract
          .connect(accounts[0])
          .purchaseTokens({ value: ethers.utils.parseEther("10") });
        await token
          .connect(accounts[0])
          .approve(contract.address, ethers.constants.MaxUint256);
      });
      it("places a bet", async () => {
        let betsLength = await contract.getArraySize();

        await contract.bet();

        expect(await contract.getArraySize()).to.be.eq(betsLength.add("1"));
      });

      it("requires sufficient LotteryToken balance to place a bet", async () => {
        const LotteryInstance = contract.connect(accounts[1]);
        await expect(LotteryInstance.bet()).to.be.revertedWith(
          "Purchase tokens to bet in the lottery"
        );
      });

      it("increments prizePool", async () => {
        const prizePoolBeforeBet = await contract.prizePool();
        const expectedPrizePoolAfterBet = prizePoolBeforeBet.add(
          ethers.utils.parseEther(BET_PRICE.toString())
        );
        await contract.bet();
        const prizePoolAfterBet = await contract.prizePool();
        expect(prizePoolAfterBet).to.be.eq(expectedPrizePoolAfterBet);
      });

      it("increments ownerPool", async () => {
        const ownerPoolBeforeBet = await contract.ownerPool();
        const expectedOwnerPoolAfterBet = ownerPoolBeforeBet.add(
          ethers.utils.parseEther(BET_FEE.toString())
        );
        await contract.bet();
        const ownerPoolAfterBet = await contract.ownerPool();
        expect(ownerPoolAfterBet).to.be.eq(expectedOwnerPoolAfterBet);
      });

      describe("betMany", () => {
        it("Bet many", async () => {
          let betsToSimulate = 5;
          let noOfBetsPriorToBetting = await contract.getArraySize();
          await contract.betMany(betsToSimulate);
          expect(await contract.getArraySize()).to.be.eq(
            noOfBetsPriorToBetting.add(betsToSimulate)
          );
        });
        it("fails if not enough tokens", async () => {
          let betsToSimulate = 1;
          expect(await contract.betMany(betsToSimulate)).to.be.revertedWith(
            "Insufficient balance to place that many bets"
          );
        });
      });
    });

    describe("Close lottery", () => {
      beforeEach(async () => {
        currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
        await contract.openBets(currentTimestamp + Number(10));
        await contract
          .connect(accounts[0])
          .purchaseTokens({ value: ethers.utils.parseEther("10") });
      });

      it("closes the lottery", async () => {
        await mine(10);
        await contract.closeLottery();

        expect(await contract.betsOpen()).to.be.false;
      });

      it("fails if trying to close lottery too early", async () => {
        await expect(contract.closeLottery()).to.be.revertedWith(
          "Too early to close lottery"
        );
      });

      it("it fails when there is no running lottery", async () => {
        await mine(10);
        await contract.closeLottery();
        await expect(contract.closeLottery()).to.be.revertedWith(
          "Already closed"
        );
      });

      it("resets the state variables", async () => {
        await mine(10);
        await contract.closeLottery();

        expect(await contract.prizePool()).to.be.eq(0);
        expect(await contract.getArraySize()).to.be.eq(0);
      });
    });

    describe("withdrawing prize money", () => {
      beforeEach(async () => {
        currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
        await contract.openBets(currentTimestamp + Number(10));
        await contract
          .connect(accounts[0])
          .purchaseTokens({ value: ethers.utils.parseEther("10") });
        await token
          .connect(accounts[0])
          .approve(contract.address, ethers.constants.MaxUint256);

        await contract.bet();
        await mine(100);

        await contract.closeLottery();
      });
      it("successfully withdraws prize money", async () => {
        let balanceBefore = await token.balanceOf(accounts[0].address);
        await contract.winnerWithdraw();

        expect(await token.balanceOf(accounts[0].address)).to.be.eq(
          balanceBefore.add(ethers.utils.parseEther(BET_PRICE.toString()))
        );
      });

      it("restricts withdrawl to only winners", async () => {
        let lottery = await contract.connect(accounts[1]);

        await expect(lottery.winnerWithdraw()).to.be.revertedWith(
          "Only a winner can withdraw funds."
        );
      });
      describe("Owner withdraw", () => {
        it("allows the owner to withdraw", async () => {
          let balanceBeforeWithdrawl = await token.balanceOf(
            accounts[0].address
          );
          let currentFees = await contract.ownerPool();
          await contract.ownerWithdraw();
          expect(await token.balanceOf(accounts[0].address)).to.be.eq(
            balanceBeforeWithdrawl.add(currentFees)
          );
        });

        it("restricts withdrawl to owner", async () => {
          let lottery = await contract.connect(accounts[1]);

          await expect(lottery.ownerWithdraw()).to.be.revertedWith(
            "Ownable: caller is not the owner"
          );
        });

        it("resets state variable", async () => {
          await contract.ownerWithdraw();

          expect(await contract.ownerPool()).to.be.eq(0);
        });
      });
    });

    describe("swapForEth", () => {
      beforeEach(async () => {
        await contract
          .connect(accounts[0])
          .purchaseTokens({ value: ethers.utils.parseEther("10") });

        await token
          .connect(accounts[0])
          .approve(contract.address, ethers.constants.MaxUint256);
      });
      it("returnTokens", async () => {
        let balance = await ethers.provider.getBalance(contract.address);
        await contract.swapForEth();
        let balanceAFTER = await ethers.provider.getBalance(contract.address);

        expect(balanceAFTER).to.be.eq(0);
      });

      it("fails if you do not have tokens", async () => {
        await expect(
          contract.connect(accounts[1]).swapForEth()
        ).to.be.revertedWith("no tokens to swap");
      });
    });
  });
});
