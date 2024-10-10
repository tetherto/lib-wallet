const { erc20CurrencyFac } = require('lib-wallet-pay-eth')

module.exports = class TetherCurrency {
  static ERC20 () {
    return erc20CurrencyFac({
      name: 'USDT',
      base_name: 'USDT',
      contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimal_places: 6
    })
  }
}
