const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
var HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "app.js",
  },
  devServer: {
    contentBase: path.resolve(__dirname, "src"),
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.ttf$/,
        use: ["file-loader"],
      },
    ],
  },
  plugins: [
    new MonacoWebpackPlugin(),
    new HtmlWebpackPlugin({ template: "index.html" }),
    new CopyPlugin({
      patterns: [{ from: "src/samples", to: "dist/samples" }],
    }),
  ],
};
