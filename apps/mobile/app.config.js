/**
 * Static Expo config lives in app.json; this overlay injects anything that has
 * to come from the environment at build time (mirrors the web app's env usage).
 */
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://stryle.in',
  },
})
