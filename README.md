# ICO Contract

This repo is a truffle project use library Open Zeppelin contracts. Token contract we use Pausabale token. Crowsdale contract we use  and modify abit TimedCrowdsale, and IndividuallyCappedCrowdsale to support whitelist sales and public sale (2 time crowdsale) and use PostDeliveryCrowdsale RefundableCrowdsale contract:

### Requirements

* Node.js 8+
* Truffle 4+
* ganache

### Test

```
truffle test
```

### deploy

```
 truffle migrate  --network {network_name} --reset
 * truffle migrate  --network local --reset
 * PRIVATE_KEY={key} truffle migrate  --network kovan --reset
 * MNEMONIC={mnemonic} truffle migrate  --network kovan --reset
```
