const STCCrowdsale = artifacts.require('./STCCrowdsale.sol');
const STCToken = artifacts.require('./STCToken.sol');

const getBlockTimeStamp =  new Promise(function(resolve,reject){
  web3.eth.getBlockNumber((err, blockNumber) => {
    if(err){
      blockNumber = 'latest';
    }
    web3.eth.getBlock(blockNumber, (error, block) => {
      const timestamp = block.timestamp;
      resolve(timestamp);
    });
  })
});

module.exports = async function (deployer, network, accounts) {
  if (process.argv[2] === 'test') { return null; }
  // TODO move to a config file...

  const decimals = 10;
  const totalSupply = new web3.BigNumber(1000000000 *  (10 ** decimals));
  const totalSupplyCrodwsale = totalSupply.div(2);

  await deployer.deploy(STCToken,totalSupply,decimals);
  const token = await STCToken.deployed();

  const startTime = await getBlockTimeStamp + 120 // 120 second in the future
  const endTime = startTime + (86400 * 7) // 7 days
  const rate = web3.toWei(1, 'ether')/((10**decimals)*100); 
  const maxBuy = web3.toWei(2, 'ether')
  const wallet = accounts[0]

  await deployer.deploy(STCCrowdsale,startTime, endTime, rate, wallet, token.address,maxBuy);
  const crowdsale = await STCCrowdsale.deployed();
  
  // transfer token from owner/deployer to crowdsale address
  await token.transfer(crowdsale.address, totalSupplyCrodwsale);

  // add wallet/owner to whitelist
  await crowdsale.addToWhitelist(wallet);
  
  console.log('\n==============================================\n');
  let balanceCrodwsale = await token.balanceOf(crowdsale.address);
  balanceCrodwsale = new web3.BigNumber(balanceCrodwsale);
  
  console.log(`Token Address : ${token.address}`);
  console.log(`crowdsale Address : ${crowdsale.address}`);
  console.log(`totalSupply : ${totalSupply.div((10**decimals)).toNumber()}`);
//  console.log(`totalSupplyCrodwsale : ${totalSupplyCrodwsale.div((10**decimals)).toNumber()}`);
  console.log(`totalSupplyCrodwsale : ${balanceCrodwsale.div((10**decimals)).toNumber()}`);
  console.log(`rate 1 ether : ${web3.toWei(1, 'ether')/(rate*(10**decimals))} token`);
  console.log(`maxBuy : ${maxBuy} wei`);
  console.log(`wallet : ${wallet}`);


};