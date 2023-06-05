// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {LotteryToken} from "./LotteryToken.sol";

/// @title Lottery
/// @author F Hersi
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
}
