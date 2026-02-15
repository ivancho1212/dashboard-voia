const path = require('path');
const webpack = require('webpack');

// ╔════════════════════════════════════════════════════════════════════════╗
// ║  WIDGET BUILD — INSTRUCCIONES DE USO                                  ║
// ║                                                                       ║
// ║  ⚠️  NO usar: npx webpack --config webpack.widget.js                  ║
// ║      (solo compila a dist/widget.js, NO copia a public/ ni wwwroot)   ║
// ║                                                                       ║
// ║  ✅  USAR:  npm run build:widget                                      ║
// ║      (compila a dist/ y copia a public/ y vo-ia/wwwroot/)             ║
// ║                                                                       ║
// ║  OUTPUT:  dist/widget.js  (build original)                            ║
// ║  COPIAS:  public/widget.js  (servido por react dev server :3000)      ║
// ║           ../vo-ia/wwwroot/widget.js  (servido por backend :5006)     ║
// ╚════════════════════════════════════════════════════════════════════════╝

module.exports = {
  entry: './src/widget/index.js', // Render directo (restaurado: iframe causaba problemas de render + memoria)
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'widget.js',
    library: {
      name: 'ViaWidget',
      type: 'umd',
    },
  },
  mode: 'development',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.REACT_APP_API_URL': JSON.stringify('http://localhost:5006'),
      'process.env.REACT_APP_BACKEND_URL': JSON.stringify('http://localhost:5006'),
      'process.env.PUBLIC_URL': JSON.stringify(''),
      'process.env.REACT_APP_DEV_API_URL': JSON.stringify('http://localhost:5006/api'),
      'process.env.REACT_APP_DEV_WIDGET_URL': JSON.stringify('http://localhost:3000/widget-frame'),
      'process.env.REACT_APP_DEV_DASHBOARD_URL': JSON.stringify('http://localhost:3000'),
      'process.env.REACT_APP_PROD_API_URL': JSON.stringify('https://api.voia-dashboard.lat/api'),
      'process.env.REACT_APP_PROD_WIDGET_URL': JSON.stringify('https://voia-dashboard.lat/widget-frame'),
      'process.env.REACT_APP_PROD_DASHBOARD_URL': JSON.stringify('https://voia-dashboard.lat'),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react'],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      layouts: path.resolve(__dirname, 'src/layouts'),
      services: path.resolve(__dirname, 'src/services'),
      config: path.resolve(__dirname, 'src/config'),
      hooks: path.resolve(__dirname, 'src/hooks'),
      utils: path.resolve(__dirname, 'src/utils'),
      contexts: path.resolve(__dirname, 'src/contexts'),
    },
  },
}