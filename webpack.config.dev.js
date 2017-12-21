const webpack = require('webpack');
const path = require('path');
const ROOT_PATH = path.resolve(__dirname);

module.exports = {
	devtool: 'source-map',
	entry: [
		'webpack-hot-middleware/client',
    './src/main.js'
  ],
  output: {
    path: path.resolve(ROOT_PATH, '/build/'),
    filename: 'bundle.js',
		publicPath: '/build/'
  },
	plugins: [
		new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
	],
	module: {
		loaders: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader',
				query: {
					presets: [ 'es2015' ]
				}
			}
      //{
      //  test: /\.glsl$/,
      //  loader: 'webpack-glsl'
      //},
			//{
			//	test: /(\.scss|\.css)$/,
			//	loader: 'style-loader!css-loader?sourceMap&modules&importLoaders=1&localIdentName=[name]-[local]___[hash:base64:5]!sass-loader?sourceMap'
			//},
		]
  }
};
