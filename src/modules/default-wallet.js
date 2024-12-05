const TetherCurrency   = require('../tether-currency')
const erc20USDT = TetherCurrency.ERC20()

const libs = [
  'lib-wallet-pay-eth',
  'lib-wallet-pay-btc',
]


const tokens = {
  'lib-wallet-pay-eth' : [
    {
      tokenType: 'ERC20',
      contract_address : erc20USDT.contractAddress,
      decimal_places: erc20USDT.decimal_places,
      name: erc20USDT.name,
      base_namc: erc20USDT.base_name
    }
  ]
}

const defaultConfig = {
  'lib-wallet-pay-eth' :{
    name : 'eth'
  },
  'lib-wallet-pay-btc' : {
    name : 'btc'
  },
}


module.exports = {
  defaultConfig,
  tokens,
  libs,
}
