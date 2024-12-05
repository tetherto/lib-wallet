const { TetherCurrency }  = require('lib-wallet')
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

async function walletExportAssetParser(data, fns) {
  let assets = []
  if(!data.assets || data.assets.length === 0) {
    
    for(let key in libs) {
      const setup = libs[key]
      const tokns = tokens[key]
      const base = defaultConfig[key]

      const opts = {...data, tokenConfig : tokns, name : base.name }
      const mod = await fns[key](opts)
      assets.push(mod)
    }
  } else {

    assets = await Promise.all(data.assets.map((asset) => {
      const setup = libs[asset.module]
      if(!setup) return null
      const mod = fns[key](asset, data)
      return mod
    }))
  }
  return assets

}

module.exports = {
  defaultConfig,
  tokens,
  libs,
}
