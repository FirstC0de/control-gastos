const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Solo watch la carpeta de shared para hot reload
config.watchFolders = [path.resolve(monorepoRoot, 'packages/shared')];

// Solo usar node_modules del mobile (standalone)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Alias para @controlados/shared
config.resolver.extraNodeModules = {
  '@controlados/shared': path.resolve(monorepoRoot, 'packages/shared/src'),
};

// Forzar CJS para todos los paquetes Firebase — evita instancias separadas
// de @firebase/component entre ESM y CJS que rompen el registro interno
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
