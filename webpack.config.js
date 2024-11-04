const path = require('path')
const webpack = require('webpack')

module.exports = {
  mode: 'development',
  entry: './src/wallet-lib.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, './example/web/dist'),
    library: 'wallet'
  },
  experiments: {
    asyncWebAssembly: true
  },
  resolve: {
    fallback: {
      buffer: require.resolve('buffer'),
      crypto: require.resolve('crypto'),
      url: require.resolve('url'),
      stream: require.resolve('stream-browserify'),
      events: require.resolve('events'),
      https: require.resolve('https-browserify'),
      http: require.resolve('http-browserify'),
      net: false
    }
  },
  plugins: [
    // Work around for Buffer is undefined:
    // https://github.com/webpack/changelog-v5/issues/10
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    })
  ]
}
