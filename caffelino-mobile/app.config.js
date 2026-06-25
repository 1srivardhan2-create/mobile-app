/** Loads .env (EXPO_PUBLIC_*) and merges with app.json */
module.exports = ({ config }) => {
  return {
    ...config,
    scheme: 'caffelino',
    android: {
      ...config.android,
      package: 'com.caffelino.mobile',
    },
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.caffelino.mobile',
    },
    extra: {
      ...config.extra,
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    },
  };
};
