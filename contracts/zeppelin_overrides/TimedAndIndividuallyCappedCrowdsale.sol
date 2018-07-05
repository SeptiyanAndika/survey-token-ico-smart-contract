pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";


/**
* @title TimedAndIndividuallyCappedCrowdsale
* @dev TimedAndIndividuallyCappedCrowdsale is based on zeppelin's Crowdsale contract.
* The difference is Crowdsale accepting contributions only within a time frame and with per-user caps modified from TimedCrowdsale and IndividuallyCappedCrowdsale.
*/

contract TimedAndIndividuallyCappedCrowdsale is Crowdsale, Ownable {
    using SafeMath for uint256;

    uint256 public openWhiteListSaleTime;
    uint256 public openPublicSaleTime;
    uint256 public endOfPublicSaleTime;
    mapping(address => uint256) public contributions;
    mapping(address => uint256) public caps;


    /**
    * @dev Reverts if not in crowdsale time range.
    */
    modifier onlyWhileOpen {
        // solium-disable-next-line security/no-block-members
        require(block.timestamp >= openWhiteListSaleTime && block.timestamp <= endOfPublicSaleTime);
        _;
    }

    /**
    * @dev Constructor, takes crowdsale opening and closing times.
    * @param _openWhiteListSaleTime Crowdsale opening wthitelist sale time
    * @param _openPublicSaleTime Crowdsale opening public sale time
    * @param _endOfPublicSaleTime Crowdsale closing time
    */
    constructor(uint256 _openWhiteListSaleTime, uint256 _openPublicSaleTime, uint256 _endOfPublicSaleTime) public {
        // solium-disable-next-line security/no-block-members
        require(_openWhiteListSaleTime >= block.timestamp);
        require(_openPublicSaleTime >= _openWhiteListSaleTime);
        require(_endOfPublicSaleTime >= _openPublicSaleTime);

        openWhiteListSaleTime = _openWhiteListSaleTime;
        openPublicSaleTime = _openPublicSaleTime;
        endOfPublicSaleTime = _endOfPublicSaleTime;
    }

    /**
    * @dev Checks whether the period in which the crowdsale is open has already elapsed.
    * @return Whether crowdsale period has elapsed
    */
    function hasClosed() public view returns (bool) {
        // solium-disable-next-line security/no-block-members
        return block.timestamp > endOfPublicSaleTime;
    }


    /**
    * @dev Checks whether the period in which the crowdsale is whitelist sale.
    * @return Whether crowdsale period is whitelist sale.
    */
    function isWhiteListSale() public view returns (bool) {
        // solium-disable-next-line security/no-block-members
        return  block.timestamp >= openWhiteListSaleTime && block.timestamp < openPublicSaleTime;
    }


    /**
    * @dev Checks whether the period in which the crowdsale is open has already elapsed.
    * @return Whether crowdsale period is public sale.
    */
    function isPublicSale() public view returns (bool) {
        // solium-disable-next-line security/no-block-members
        return block.timestamp >= openPublicSaleTime && block.timestamp <= endOfPublicSaleTime;
    }

    /**
    * @dev Sets a specific user's maximum contribution.
    * @param _beneficiary Address to be capped
    * @param _cap Wei limit for individual contribution
    */
    function setUserCap(address _beneficiary, uint256 _cap) external onlyOwner {
        caps[_beneficiary] = _cap;
    }


    /**
    * @dev Get a specific user's is whitelist or not.
    * @param _beneficiary Address user
    */
    function isWhitelist(address _beneficiary) public view returns (bool) {
        return caps[_beneficiary] > 0;
    }


    /**
    * @dev Sets a group of users' maximum contribution.
    * @param _beneficiaries List of addresses to be capped
    * @param _cap Wei limit for individual contribution
    */
    function setGroupCap(address[] _beneficiaries, uint256 _cap) external onlyOwner
    {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            caps[_beneficiaries[i]] = _cap;
        }
    }

    /**
    * @dev Sets a multi users' maximum contribution.
    * @param _beneficiaries List of addresses to be capped
    * @param _cap List of Wei limit for  contribution
    */
    function setMultiUserCap(address[] _beneficiaries, uint256[] _cap) external onlyOwner
    {
        require(_beneficiaries.length == _cap.length);

        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            caps[_beneficiaries[i]] = _cap[i];
        }
    }

    /**
    * @dev Returns the cap of a specific user.
    * @param _beneficiary Address whose cap is to be checked
    * @return Current cap for individual user
    */
    function getUserCap(address _beneficiary) public view returns (uint256) {
        return caps[_beneficiary];
    }

    /**
    * @dev Returns the amount contributed so far by a sepecific user.
    * @param _beneficiary Address of contributor
    * @return User contribution so far
    */
    function getUserContribution(address _beneficiary) public view returns (uint256) {
        return contributions[_beneficiary];
    }

    /**
    * @dev Extend parent behavior requiring to be within contributing period and whitelist or public
    * @param _beneficiary Token purchaser
    * @param _weiAmount Amount of wei contributed
    */
    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal onlyWhileOpen {
        super._preValidatePurchase(_beneficiary, _weiAmount);
        
        if(isWhiteListSale()){
            require(contributions[_beneficiary].add(_weiAmount) <= caps[_beneficiary]);
        }

    }

    /**
    * @dev Extend parent behavior to update user contributions
    * @param _beneficiary Token purchaser
    * @param _weiAmount Amount of wei contributed
    */
    function _updatePurchasingState(address _beneficiary, uint256 _weiAmount) internal {
        super._updatePurchasingState(_beneficiary, _weiAmount);
        contributions[_beneficiary] = contributions[_beneficiary].add(_weiAmount);
    }

}