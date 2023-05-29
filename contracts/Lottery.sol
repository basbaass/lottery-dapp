// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

contract Lottery is Ownable {
/// @notice flag indicating whether the lottery is open for betting
bool public betsOpen;

constructor() {}

modifier whenBetsClosed() {
    require(!betsOpen);
    _;
}
 
function openBets(uint8 _targetEndTime) external onlyOwner whenBetsClosed {

}

}