pragma solidity ^0.4.22;

import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

contract STCToken is PausableToken {
    

    string public constant name = "Survey Token";
    string public constant symbol = "STC";
    uint   public decimals;
    constructor(uint INITIAL_SUPPLY, uint _decimals) public { 
        decimals = _decimals;
        totalSupply_ = INITIAL_SUPPLY;
        balances[msg.sender] = INITIAL_SUPPLY;
        emit Transfer(0x0, msg.sender, INITIAL_SUPPLY);
    }

}