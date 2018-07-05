pragma solidity ^0.4.24;

import "./TimedAndIndividuallyCappedCrowdsale.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";


/**
* @title FinalizableCrowdsale
* @dev FinalizableCrowdsale is based on zeppelin's Crowdsale contract.
* The difference is that we're using TimedAndIndividuallyCappedCrowdsale instead of TimedCrowdsale.
*/

contract FinalizableCrowdsale is TimedAndIndividuallyCappedCrowdsale {
    using SafeMath for uint256;

    bool public isFinalized = false;

    event Finalized();

    /**
    * @dev Must be called after crowdsale ends, to do some extra finalization
    * work. Calls the contract's finalization function.
    */
    function finalize() onlyOwner public {
        require(!isFinalized);
        require(hasClosed());

        finalization();
        emit Finalized();

        isFinalized = true;
    }

    /**
    * @dev Can be overridden to add finalization logic. The overriding function
    * should call super.finalization() to ensure the chain of finalization is
    * executed entirely.
    */
    function finalization() internal {
    }

}