pragma solidity ^0.4.22;

import "./zeppelin_overrides/RefundableCrowdsale.sol";
import "./zeppelin_overrides/PostDeliveryCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";

contract STCCrowdsale is CappedCrowdsale, RefundableCrowdsale, PostDeliveryCrowdsale {
    
    constructor(
        uint256 _openWhiteListSaleTime, 
        uint256 _openPublicSaleTime, 
        uint256 _endOfPublicSaleTime, 
        uint256 _rate, 
        address _wallet,
        uint256 _softCap, 
        uint256 _hardCap,
        ERC20 _token)
        public 
        Crowdsale(_rate, _wallet,_token)
        TimedAndIndividuallyCappedCrowdsale(_openWhiteListSaleTime, _openPublicSaleTime,_endOfPublicSaleTime)
        RefundableCrowdsale(_softCap)
        CappedCrowdsale(_hardCap){ 
    
    }

    function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256)
    {
        return _weiAmount.div(rate);
    }
    
}