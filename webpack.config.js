const url = require('url');
const path = require('path');

const magicImporter = require('node-sass-magic-importer');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const { ProvidePlugin } = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const SpritesmithPlugin = require('webpack-spritesmith');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPNGquant = require('imagemin-pngquant');
const ImageminWebpackPlugin = require('imagemin-webpack-plugin').default;

const sourceMap = {
	sourceMap: true
};

const postcssConfig = {
	plugins: [
		require('postcss-easy-import'),
		require('postcss-url')({
			url: 'rebase'
		}),
		require('postcss-utilities')
	],
	...sourceMap
};

const babelConfig = [
	{
		loader: 'babel-loader',
		options: {
			cacheDirectory: true,
			comments: false,
			presets: ['env', 'stage-2']
		}
	}
];

const browserSyncConfig = {
	host: 'localhost',
	port: 3000,
	open: 'external',
	files: [
		'**/*.php',
		'**/*.html',
		'./assets/dist/app.css',
		'./assets/dist/app.js'
	],
	ghostMode: {
		clicks: false,
		scroll: true,
		forms: {
			submit: true,
			inputs: true,
			toggles: true
		}
	},
	snippetOptions: {
		rule: {
			match: /<\/body>/i,
			fn: (snippet, match) => `${snippet}${match}`
		}
	},
	proxy: 'localhost'
};

const extractTextConfig = {
	filename: 'assets/dist/app.css',
	allChunks: true
};

const spritesmithConfig = {
	src: {
		cwd: path.resolve(__dirname, 'assets/images/sprite'),
		glob: '*.png'
	},
	target: {
		image: path.resolve(__dirname, './assets/dist/sprite.png'),
		css: path.resolve(__dirname, './assets/styles/_sprite.scss')
	},
	apiOptions: {
		cssImageRef: '../dist/sprite.png'
	},
	retina: '@2x'
};

const cleanConfig = {
	verbose: false,
	exclude: ['sprite.svg']
};

const imageminConfig = {
	test: /\.(jpe?g|png|gif|svg)$/i,
	gifsicle: {
		interlaced: true
	},
	svgo: {
		plugins: [
			{ cleanupAttrs: true },
			{ removeDoctype: true },
			{ removeXMLProcInst: true },
			{ removeComments: true },
			{ removeMetadata: true },
			{ removeUselessDefs: true },
			{ removeEditorsNSData: true },
			{ removeEmptyAttrs: true },
			{ removeHiddenElems: false },
			{ removeEmptyText: true },
			{ removeEmptyContainers: true },
			{ cleanupEnableBackground: true },
			{ removeViewBox: true },
			{ cleanupIDs: false },
			{ convertStyleToAttrs: true }
		]
	},
	plugins: [
		imageminMozjpeg({
			quality: 70
		}),
		imageminPNGquant({
			speed: 1,
			quality: 90
		})
	]
};

module.exports = env => {
	const isDevelopment = env.NODE_ENV === 'development';
	const isProduction = env.NODE_ENV === 'production';

	if (isProduction) {
		postcssConfig.plugins.push(
			require('postcss-flexbugs-fixes'),
			require('postcss-merge-rules'),
			require('autoprefixer')(),
			require('cssnano')({
				discardComments: {
					removeAll: true
				}
			})
		);
	}

	const config = {
		entry: ['./assets/styles/main.scss', './assets/scripts/main.js'],
		output: {
			filename: './assets/dist/app.js'
		},
		resolve: {
			modules: [
				'node_modules',
				'./assets/scripts',
				'./assets/images/sprite'
			]
		},
		module: {
			rules: [
				{
					test: /\.scss$/,
					use: ExtractTextPlugin.extract({
						use: [
							{
								loader: 'css-loader',
								options: sourceMap
							},
							{
								loader: 'postcss-loader',
								options: postcssConfig
							},
							{
								loader: 'sass-loader',
								options: {
									importer: magicImporter(),
									...sourceMap
								}
							}
						],
						fallback: 'style-loader'
					})
				},
				{
					test: /\.js$/,
					exclude: /node_modules/,
					use: babelConfig
				},
				{
					test: /\.(jpe?g|gif|png|svg|woff2?|ttf|eot|wav|mp3|mp4)(\?.*$|$)/,
					use: [
						{
							loader: 'file-loader',
							options: {
								name: '[hash].[ext]',
								context: '',
								publicPath: '../../',
								outputPath: 'assets/dist/'
							}
						}
					]
				}
			]
		},
		plugins: [
			new ProvidePlugin({
				$: 'jquery',
				jQuery: 'jquery',
				'window.jQuery': 'jquery'
			}),
			new ExtractTextPlugin(extractTextConfig),
			new SpritesmithPlugin(spritesmithConfig),
			new CleanWebpackPlugin(['./assets/dist/'], cleanConfig)
		],
		cache: true,
		bail: false,
		devtool: 'source-map',
		stats: 'errors-only'
	};

	if (isDevelopment) {
		if (env.url) {
			browserSyncConfig.host = url.parse(env.url).hostname;
			browserSyncConfig.proxy = env.url;
		}

		config.plugins.push(
			new BrowserSyncPlugin(browserSyncConfig, {
				reload: false
			})
		);
	}

	if (isProduction) {
		config.plugins.push(
			new UglifyJSPlugin(sourceMap),
			new ImageminWebpackPlugin(imageminConfig)
		);
	}

	return config;
};
