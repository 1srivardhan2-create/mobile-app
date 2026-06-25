module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Do not add reanimated/worklets plugins here — babel-preset-expo adds
    // react-native-worklets/plugin automatically for Reanimated 4 + Expo SDK 54.
  };
};
