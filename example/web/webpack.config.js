// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
const path = require('path')
const webpack = require('webpack')

module.exports = {
  mode: 'development',
  entry: './entry.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, './dist'),
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
