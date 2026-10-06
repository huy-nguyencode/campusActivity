// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Reanimated shared values are updated by assigning to `.value`. The React
    // Compiler's immutability rule does not recognize that API.
    files: [
      'screens/LocationWelcomeScreen.tsx',
      'screens/PlaceDetailsScreen.tsx',
      'components/checkin/CrowdLevelButtons.tsx',
      'components/checkin/CooldownTimer.tsx',
      'components/places/PlaceCard.tsx',
    ],
    rules: {
      'react-hooks/immutability': 'off',
    },
  },
]);
