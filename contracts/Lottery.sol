// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {LotteryToken} from "./LotteryToken.sol";

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
    uint256 betPrice;
    /// @notice the fee associated with each bet - paid to the ownerPool;
    uint256 betFee;
    /// @notice the total amount winnable for the current lottery
    uint256 prizePool;
    /// @notice the total fees collected from each betFee
    uint256 ownerPool;

    /// @notice mapping of each winners address and prizeAmount.
    /// @dev allows further lotterys to run without state being cleared.
    mapping(address => uint256) winnersPool;

    /// @notice Array of participants in current running lottery.
    /// @dev This is wiped after each lottery ends.
    address[] _slots;

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
}
