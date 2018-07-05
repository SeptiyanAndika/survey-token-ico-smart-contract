
import ether from 'zeppelin-solidity/test/helpers/ether';
import { advanceBlock } from 'zeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from 'zeppelin-solidity/test/helpers/increaseTime';
import latestTime from 'zeppelin-solidity/test/helpers/latestTime';
import EVMRevert from 'zeppelin-solidity/test/helpers/EVMRevert';
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const STCCrowdsale = artifacts.require('./STCCrowdsale.sol');
const STCToken = artifacts.require('./STCToken.sol');

contract('PostDeliveryCrowdsale', function ([_, investor, wallet, purchaser]) {
    const decimals = 10;
    const rate = ether(1)/((10**decimals)*100); // 1 ether 100 token
    const value = ether(2);
    const softCap = ether(10);
    const hardCap = ether(20);
    const totalSupply = 1000000000 *  (10 ** decimals);
    const totalSupplyCrodwsale = new BigNumber(totalSupply/2);

    before(async function () {
      // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
      await advanceBlock();
    });
    
    beforeEach(async function () {
      this.openWhiteListSaleTime = latestTime() + duration.days(1);
      this.openPublicSaleTime =  this.openWhiteListSaleTime + duration.days(1)+ duration.seconds(1);
      this.endOfPublicSaleTime = this.openPublicSaleTime + duration.weeks(1);
      this.beforeEndOfPublicSaleTime = this.endOfPublicSaleTime - duration.hours(1);
      this.afterEndOfPublicSaleTime = this.endOfPublicSaleTime + duration.seconds(1);
      this.token = await STCToken.new(totalSupply,decimals);
      this.crowdsale = await STCCrowdsale.new(this.openWhiteListSaleTime, this.openPublicSaleTime, this.endOfPublicSaleTime, rate, wallet,softCap, hardCap, this.token.address);
      await this.token.transfer(this.crowdsale.address, totalSupplyCrodwsale);
     
    });

    it('should not immediately assign tokens to beneficiary', async function () {
      await increaseTimeTo(this.openPublicSaleTime);
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(0);
    });

    it('should not allow beneficiaries to withdraw tokens before crowdsale ends', async function () {
      await increaseTimeTo(this.beforeEndOfPublicSaleTime);
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }); 
      await this.crowdsale.withdrawTokens({ from: investor }).should.be.rejectedWith(EVMRevert);
    });

    it('should allow beneficiaries to withdraw tokens after crowdsale ends', async function () {
      await increaseTimeTo(this.openPublicSaleTime);
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      await increaseTimeTo(this.afterEndOfPublicSaleTime);
      await this.crowdsale.withdrawTokens({ from: investor }).should.be.fulfilled;
    });

    it('should return the amount of tokens bought after withdraw', async function () {
      await increaseTimeTo(this.openPublicSaleTime);
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      await increaseTimeTo(this.afterEndOfPublicSaleTime);
      await this.crowdsale.withdrawTokens({ from: investor });
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(value.div(rate));
    });

    it('should return the amount of tokens bought after send token to buyer', async function () {
      await increaseTimeTo(this.openPublicSaleTime);
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      await increaseTimeTo(this.afterEndOfPublicSaleTime);
      await this.crowdsale.sendTokensToBeneficiary(investor,{from: _ });
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(value.div(rate));
    });

    it('should return the amount of tokens bought after send  token to many buyer', async function () {
      await increaseTimeTo(this.openPublicSaleTime);
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      await this.crowdsale.sendTransaction({ value: value, from: purchaser });
      await increaseTimeTo(this.afterEndOfPublicSaleTime);
      await this.crowdsale.sendTokensToManyBeneficiary([investor,purchaser],{from: _ });
      const balance1 = await this.token.balanceOf(investor);
      balance1.should.be.bignumber.equal(value.div(rate));
      const balance2 = await this.token.balanceOf(purchaser);
      balance2.should.be.bignumber.equal(value.div(rate));
    });

});  