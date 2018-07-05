
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

contract('TimeWhiteListCrowdsale', function ([_, investor, wallet, authorized, unauthorized, anotherAuthorized]) {
    const decimals = 10;
    const rate = ether(1)/((10**decimals)*100); // 1 ether 100 token
    const value = ether(2);
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

    it('should be ended only after end', async function () {
      let ended = await this.crowdsale.hasClosed();
      ended.should.equal(false);
      await increaseTimeTo(this.afterEndOfPublicSaleTime);
      ended = await this.crowdsale.hasClosed();
      ended.should.equal(true);
    });
    
    describe('Timed Crowdsale Test', function () {
      describe('accepting payments ', function () {
    
        it('should accept payments after start whitelist sale', async function () {
          await increaseTimeTo(this.openWhiteListSaleTime);
          await this.crowdsale.setUserCap(_,value);
          await this.crowdsale.send(value).should.be.fulfilled;
          await this.crowdsale.setUserCap(authorized,value);
          await this.crowdsale.buyTokens(authorized, { value: value, from: investor }).should.be.fulfilled;
        });

        it('should accept payments after start public sale', async function () {
          await increaseTimeTo(this.openPublicSaleTime);
          await this.crowdsale.sendTransaction({ value, from: unauthorized }).should.be.fulfilled;
          await this.crowdsale.buyTokens(anotherAuthorized, { value: value, from: investor }).should.be.fulfilled;
        });
    
      });

      describe('rejected payments ', function () {
        it('should reject payments before start', async function () {
          await this.crowdsale.send(value).should.be.rejectedWith(EVMRevert);
          await this.crowdsale.buyTokens(authorized, { from: investor, value: value }).should.be.rejectedWith(EVMRevert);
        });

        it('should reject payments after start whitelist sale if send more than caps', async function () {
          await increaseTimeTo(this.openWhiteListSaleTime);
          await this.crowdsale.setUserCap(_,value);
          await this.crowdsale.send(ether(3)).should.be.rejectedWith(EVMRevert);
          await this.crowdsale.setUserCap(authorized,value);
          await this.crowdsale.buyTokens(authorized, { value: ether(3), from: investor }).should.be.rejectedWith(EVMRevert);
        });

        it('should reject payments after end', async function () {
          await increaseTimeTo(this.afterEndOfPublicSaleTime);
          await this.crowdsale.send(value).should.be.rejectedWith(EVMRevert);
          await this.crowdsale.buyTokens(authorized, { value: value, from: investor }).should.be.rejectedWith(EVMRevert);
        });

      });

    })
    
    describe('Whitelisted capped Crowdsale Test', function () {
      describe('single user whitelisting with cap', function () {
        beforeEach(async function () {
          await increaseTimeTo(this.openWhiteListSaleTime);
        });

        describe('accepting payments', function () {
          it('should accept payments to whitelisted (from whichever buyers)', async function () {
            await this.crowdsale.setUserCap(authorized,value);
            await this.crowdsale.sendTransaction({ value:ether(1), from: authorized }).should.be.fulfilled;
            await this.crowdsale.buyTokens(authorized, { value: ether(1), from: unauthorized }).should.be.fulfilled;
          });
    
          it('should reject payments to not whitelisted (from whichever buyers)', async function () {
            await this.crowdsale.sendTransaction({ value, from: unauthorized }).should.be.rejected;
            await this.crowdsale.buyTokens(unauthorized, { value: value, from: unauthorized }).should.be.rejected;
            await this.crowdsale.buyTokens(unauthorized, { value: value, from: authorized }).should.be.rejected;
          });
    
          it('should reject payments to addresses removed from whitelist', async function () {
            await this.crowdsale.setUserCap(authorized,0);
            await this.crowdsale.buyTokens(authorized, { value: value, from: authorized }).should.be.rejected;
          });
        });
    
        describe('reporting whitelisted', function () {
          it('should correctly report whitelisted addresses', async function () {
            await this.crowdsale.setUserCap(authorized,value);
            let isAuthorized = await this.crowdsale.isWhitelist(authorized);
            isAuthorized.should.equal(true);
            let isntAuthorized = await this.crowdsale.isWhitelist(unauthorized);
            isntAuthorized.should.equal(false);
          });
        });
      });

      describe('Group whitelisting capped ', function () {
        beforeEach(async function () {
          await this.crowdsale.setGroupCap([authorized, anotherAuthorized],value);
          await increaseTimeTo(this.openWhiteListSaleTime);
        });
    
        describe('accepting payments', function () {
          it('should accept payments to whitelisted (from whichever buyers)', async function () {
            await this.crowdsale.buyTokens(authorized, { value: value, from: authorized }).should.be.fulfilled;
            await this.crowdsale.buyTokens(anotherAuthorized, { value: value, from: authorized }).should.be.fulfilled;
          });
    
          it('should reject payments to not whitelisted (with whichever buyers)', async function () {
            await this.crowdsale.send( { value: value, from: unauthorized }).should.be.rejected;
            await this.crowdsale.buyTokens(unauthorized, { value: value, from: unauthorized }).should.be.rejected;
            await this.crowdsale.buyTokens(unauthorized, { value: value, from: authorized }).should.be.rejected;
          });
    
          it('should reject payments to addresses removed from whitelist', async function () {
            await this.crowdsale.setUserCap(anotherAuthorized,0);
            await this.crowdsale.buyTokens(authorized, { value: value, from: authorized }).should.be.fulfilled;
            await this.crowdsale.buyTokens(anotherAuthorized, { value: value, from: authorized }).should.be.rejected;
          });
        });
    
        describe('reporting whitelisted', function () {
          it('should correctly report whitelisted addresses', async function () {
            let isAuthorized = await this.crowdsale.isWhitelist(authorized);
            isAuthorized.should.equal(true);
            let isAnotherAuthorized = await this.crowdsale.isWhitelist(anotherAuthorized);
            isAnotherAuthorized.should.equal(true);
            let isntAuthorized = await this.crowdsale.isWhitelist(unauthorized);
            isntAuthorized.should.equal(false);
          });
        });
      });


      describe('multi user whitelisting capped ', function () {
        beforeEach(async function () {
          await this.crowdsale.setMultiUserCap([authorized, anotherAuthorized],[value,value]);
          await increaseTimeTo(this.openWhiteListSaleTime);
        });
    
        describe('accepting payments', function () {
          it('should accept payments to whitelisted (from whichever buyers)', async function () {
            await this.crowdsale.buyTokens(authorized, { value: value, from: authorized }).should.be.fulfilled;
            await this.crowdsale.buyTokens(anotherAuthorized, { value: value, from: authorized }).should.be.fulfilled;
          });
    
          it('should reject payments to not whitelisted (with whichever buyers)', async function () {
            await this.crowdsale.send( { value: value, from: unauthorized }).should.be.rejected;
            await this.crowdsale.buyTokens(unauthorized, { value: value, from: unauthorized }).should.be.rejected;
            await this.crowdsale.buyTokens(unauthorized, { value: value, from: authorized }).should.be.rejected;
          });
    
          it('should reject payments to addresses removed from whitelist', async function () {
            await this.crowdsale.setUserCap(anotherAuthorized,0);
            await this.crowdsale.buyTokens(authorized, { value: value, from: authorized }).should.be.fulfilled;
            await this.crowdsale.buyTokens(anotherAuthorized, { value: value, from: authorized }).should.be.rejected;
          });
        });
    
        describe('reporting whitelisted', function () {
          it('should correctly report whitelisted addresses', async function () {
            let isAuthorized = await this.crowdsale.isWhitelist(authorized);
            isAuthorized.should.equal(true);
            let isAnotherAuthorized = await this.crowdsale.isWhitelist(anotherAuthorized);
            isAnotherAuthorized.should.equal(true);
            let isntAuthorized = await this.crowdsale.isWhitelist(unauthorized);
            isntAuthorized.should.equal(false);
          });
        });
      });
    });

});  