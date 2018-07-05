pragma solidity ^0.4.24;

import "./TimedAndIndividuallyCappedCrowdsale.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


/**
* @title PostDeliveryCrowdsale
* @dev PostDeliveryCrowdsale is based on zeppelin's Crowdsale contract.
* The difference is that we're using TimedAndIndividuallyCappedCrowdsale instead of TimedCrowdsale.
*/

contract PostDeliveryCrowdsale is TimedAndIndividuallyCappedCrowdsale {
    using SafeMath for uint256;

    mapping(address => uint256) public balances;

    /**
    * @dev Withdraw tokens only after crowdsale ends.
    */
    function withdrawTokens() public {
        require(hasClosed());
        require(token != address(0));

        uint256 amount = balances[msg.sender];
        require(amount > 0);
        balances[msg.sender] = 0;
        _deliverTokens(msg.sender, amount);
    }


    /**
    * @dev Send tokens only after crowdsale ends.
    */
    function sendTokensToBeneficiary(address _beneficiary) external onlyOwner {
        require(hasClosed());
        require(token != address(0));
        
        uint256 amount = balances[_beneficiary];
        require(amount > 0);
        balances[_beneficiary] = 0;
        _deliverTokens(_beneficiary, amount);
    }

    /**
    * @dev Send tokens to Many only after crowdsale ends.
    */
    function sendTokensToManyBeneficiary(address[] _beneficiaries) external onlyOwner {
        require(hasClosed());
        require(token != address(0));
        
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            address _beneficiary = _beneficiaries[i]; 
            uint256 amount = balances[_beneficiary];
            if(amount > 0) {
                balances[_beneficiary] = 0;
                _deliverTokens(_beneficiary, amount);
            }
        }
       
    }


    /**
    * @dev Overrides parent by storing balances instead of issuing tokens right away.
    * @param _beneficiary Token purchaser
    * @param _tokenAmount Amount of tokens purchased
    */
    function _processPurchase(address _beneficiary, uint256 _tokenAmount)internal {
        balances[_beneficiary] = balances[_beneficiary].add(_tokenAmount);
    }

}