const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Blocklist specific directories from Metro's file watcher to prevent ENOENT errors on Windows
config.resolver.blockList = [
  ...config.resolver.blockList,
  /.*\.cxx.*/,
  /.*node_modules[/\\]react-native-reanimated[/\\]android[/\\]\.cxx.*/
];

module.exports = config;
