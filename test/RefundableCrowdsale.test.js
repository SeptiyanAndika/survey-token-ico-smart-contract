
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

contract('RefundableCrowdsale', function ([_, investor, wallet]) {
    const decimals = 10;
    const rate = ether(1)/((10**decimals)*100); // 1 ether 100 token
    const lessThanSoftCap = ether(5);
    const softCap = ether(10);
    const hardCap = ether(20);
    const totalSupply = 1000000000 *  (10 ** decimals);
 
    before(async function () {
      // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
      await advanceBlock();
    });
    
    beforeEach(async function () {
      this.openWhiteListSaleTime = latestTime() + duration.days(1);
      this.openPublicSaleTime =  this.openWhiteListSaleTime + duration.days(1)+ duration.seconds(1);
      this.endOfPublicSaleTime = this.openPublicSaleTime + duration.weeks(1);
      this.afterEndOfPublicSaleTime = this.endOfPublicSaleTime + duration.seconds(1);
      this.token = await STCToken.new(totalSupply,decimals);
      this.crowdsale = await STCCrowdsale.new(this.openWhiteListSaleTime, this.openPublicSaleTime, this.endOfPublicSaleTime, rate, wallet,softCap, hardCap, this.token.address);
      
     });

    describe('Refundable Test', function () {
      it('should deny refunds before end', async function () {
        await this.crowdsale.claimRefund({ from: investor }).should.be.rejectedWith(EVMRevert);
        await increaseTimeTo(this.openPublicSaleTime);
        await this.crowdsale.claimRefund({ from: investor }).should.be.rejectedWith(EVMRevert);
      });
    
      it('should deny refunds after end if goal was reached', async function () {
        await increaseTimeTo(this.openPublicSaleTime);
        await this.crowdsale.sendTransaction({ value: softCap, from: investor });
        await increaseTimeTo(this.afterEndOfPublicSaleTime);
        await this.crowdsale.claimRefund({ from: investor }).should.be.rejectedWith(EVMRevert);
      });
    
      it('should allow refunds after end if goal was not reached', async function () {
        await increaseTimeTo(this.openPublicSaleTime);
        await this.crowdsale.sendTransaction({ value: lessThanSoftCap, from: investor });
        await increaseTimeTo(this.afterEndOfPublicSaleTime);
        await this.crowdsale.finalize({ from: _ });
        const pre = web3.eth.getBalance(investor);
        await this.crowdsale.claimRefund({ from: investor, gasPrice: 0 })
          .should.be.fulfilled;
        const post = web3.eth.getBalance(investor);
        post.minus(pre).should.be.bignumber.equal(lessThanSoftCap);
      });
    
      it('should forward funds to wallet after end if goal was reached', async function () {
        await increaseTimeTo(this.openPublicSaleTime);
        await this.crowdsale.sendTransaction({ value: softCap, from: investor });
        await increaseTimeTo(this.afterEndOfPublicSaleTime);
        const pre = web3.eth.getBalance(wallet);
        await this.crowdsale.finalize({ from: _ });
        const post = web3.eth.getBalance(wallet);
        post.minus(pre).should.be.bignumber.equal(softCap);
      });
    });

});  