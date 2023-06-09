// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {LotteryToken} from "./LotteryToken.sol";

/// @title Lottery
/// @author F H
/// @notice You can use this for a running a simple Lottery
/// @dev uses a simple Random function implementation of Randao.
/// @custom:bootcamp This was created as part of the Encode Solidity Bootcamp

contract Lottery is Ownable {
    /// @notice Address of the ERC20 token used for payments
    LotteryToken public paymentToken;
    /// @notice flag indicating whether the lottery is open for betting
    bool public betsOpen;
    /// @notice timestamp of the closing time of the current lottery
    uint256 public betsClosingTime;
    /// @notice Ratio determining the ration of LotteryTokens to Eth
    uint256 tokenRatio;
    /// @notice the cost of each bet - paid to the prizePool
    uint256 public betPrice;
    /// @notice the fee associated with each bet - paid to the ownerPool;
    uint256 public betFee;
    /// @notice the total amount winnable for the current lottery
    uint256 public prizePool;
    /// @notice the total fees collected from each betFee
    uint256 public ownerPool;

    /// @notice mapping of each winners address and prizeAmount.
    /// @dev allows further lotterys to run without state being cleared.
    mapping(address => uint256) public winnersPool;

    /// @notice Array of participants in current running lottery.
    /// @dev This is wiped after each lottery ends.
    address[] private _slots;

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 _tokenRatio,
        uint256 _betPrice,
        uint256 _betFee
    ) {
        paymentToken = new LotteryToken(tokenName, tokenSymbol);
        tokenRatio = _tokenRatio;
        betPrice = _betPrice;
        betFee = _betFee;
    }

    /// @notice modifier to ensure that there are no running lotterys
    /// @dev checks flag to ensure no lotterys are live
    modifier whenBetsClosed() {
        require(!betsOpen, "Lottery is open");
        _;
    }

    /// @notice modifier to ensure that there is a live lottery in progress
    /// @dev checks whether bets are open as well as
    modifier whenBetsOpen() {
        require(
            betsOpen && block.timestamp < betsClosingTime,
            "Lottery is closed"
        );
        _;
    }

    /// @notice starts a Lottery to begin receiving bets.
    /// @param _targetEndTime the timestamp of when the lottery will end.
    function openBets(
        uint256 _targetEndTime
    ) external onlyOwner whenBetsClosed {
        require(
            _targetEndTime > block.timestamp,
            "End time must be in the future"
        );
        betsClosingTime = _targetEndTime;
        betsOpen = true;
    }

    /// @notice purchases LotteryToken for placing bets in lottery
    /// @dev mints from the token contract passed in the constructor.

    function purchaseTokens() external payable {
        require(
            msg.value > 0,
            "Ether is required to purchase tokens, try again by providing Ether"
        );
        uint256 _amount = msg.value * tokenRatio;
        paymentToken.mint(msg.sender, _amount);
    }

    /// @notice Places a bet
    /// @dev charges in Lottery Token (ERC20) for the bet..
    function bet() public whenBetsOpen {
        require(
            paymentToken.balanceOf(msg.sender) >= betFee + betPrice,
            "Purchase tokens to bet in the lottery"
        );
        ownerPool += betFee;
        prizePool += betPrice;
        _slots.push(msg.sender);

        paymentToken.transferFrom(msg.sender, address(this), betFee + betPrice);
        //paymentToken.transfer(address(this), betPrice + betFee);
    }

    /// @notice Places multiple bets
    /// @param _bets is the amount of times to call the bet function
    /// @dev balance is checked to determine if caller can perform all _bets.
    function betMany(uint _bets) external whenBetsOpen {
        uint cost = betFee + betPrice;

        require(
            paymentToken.balanceOf(msg.sender) >= _bets * cost,
            "Insufficient balance to place that many bets"
        );
        for (uint i = 0; i < _bets; i++) {
            bet();
        }
    }

    /// @notice Closes lottery
    /// @dev wipes variables and transfers prize money to winners pool.
    function closeLottery() external returns (address) {
        require(
            block.timestamp >= betsClosingTime,
            "Too early to close lottery"
        );
        address winner;
        require(betsOpen, "Already closed");
        if (_slots.length > 0) {
            uint256 winnerIndex = randomNumber() % _slots.length;
            winner = _slots[winnerIndex];
            winnersPool[winner] = prizePool;
            prizePool = 0;
            delete _slots;
        }

        betsOpen = false;
        return winner;
    }

    /// @notice withdraws prize money from contract
    function winnerWithdraw() external {
        require(
            winnersPool[msg.sender] > 0,
            "Only a winner can withdraw funds."
        );
        uint256 prize = winnersPool[msg.sender];
        winnersPool[msg.sender] = 0;
        paymentToken.transfer(msg.sender, prize);
    }

    /// @notice withdraws owner fees from contract
    function ownerWithdraw() external onlyOwner {
        require(ownerPool > 0, "currently no funds in pool");
        uint256 totalFees = ownerPool;
        ownerPool = 0;
        paymentToken.transfer(msg.sender, totalFees);
    }

    function swapForEth() external {
        require(paymentToken.balanceOf(msg.sender) > 0, "no tokens to swap");
        uint256 balance = paymentToken.balanceOf(msg.sender);
        uint256 refundAmount = balance / tokenRatio;

        paymentToken.burnFrom(msg.sender, balance);

        (bool success, ) = msg.sender.call{value: refundAmount}("");
        require(success, "Payment failed.");
    }

    /// @notice returns random number
    /// @dev impletents pseudorandom function. would be better to use chainlink vrf
    function randomNumber() internal view returns (uint256) {
        return block.prevrandao;
    }

    /// @notice returns array length
    /// @dev allows the array to remain private;
    function getArraySize() public view onlyOwner returns (uint256) {
        return _slots.length;
    }
}
