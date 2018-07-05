
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

contract('CappedCrowdsale', function ([_, wallet]) {
    const decimals = 10;
    const rate = ether(1)/((10**decimals)*100); // 1 ether 100 token
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

    describe('Capped Test', function () {
      beforeEach(async function () {
        await this.crowdsale.setUserCap(_,hardCap);
        await increaseTimeTo(this.openWhiteListSaleTime);
      });
      
      describe('accepting payments', function () {
        it('should accept payments within cap', async function () {
          await this.crowdsale.send(hardCap.minus(softCap)).should.be.fulfilled;
          await this.crowdsale.send(softCap).should.be.fulfilled;
        });
    
        it('should reject payments outside cap', async function () {
          await this.crowdsale.send(hardCap);
          await this.crowdsale.send(1).should.be.rejectedWith(EVMRevert);
        });
    
        it('should reject payments that exceed cap', async function () {
          await this.crowdsale.send(hardCap.plus(1)).should.be.rejectedWith(EVMRevert);
        });
      });

      describe('ending', function () {
        it('should not reach cap if sent under cap', async function () {
          let capReached = await this.crowdsale.capReached();
          capReached.should.equal(false);
          await this.crowdsale.send(softCap);
          capReached = await this.crowdsale.capReached();
          capReached.should.equal(false);
        });
    
        it('should not reach cap if sent just under cap', async function () {
          await this.crowdsale.send(hardCap.minus(1));
          let capReached = await this.crowdsale.capReached();
          capReached.should.equal(false);
        });
    
        it('should reach cap if cap sent', async function () {
          await this.crowdsale.send(hardCap);
          let capReached = await this.crowdsale.capReached();
          capReached.should.equal(true);
        });
      });

    });


});  