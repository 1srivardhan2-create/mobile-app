/**
 * Ensures google-services.json exists at project root AND android/app/
 * Run: npm run copy:google-services
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const rootDest = path.join(root, 'google-services.json');
const androidDest = path.join(root, 'android', 'app', 'google-services.json');

const sources = [
  path.join(root, 'google-services.json'),
  path.join(root, '..', 'file-main', 'android', 'app', 'google-services.json'),
];

let srcPath = null;
for (const src of sources) {
  if (fs.existsSync(src)) {
    srcPath = src;
    break;
  }
}

if (!srcPath) {
  console.error(`
google-services.json not found.

Download from Firebase Console (package: com.caffelino.mobile) and save to:
  caffelino-mobile/google-services.json
`);
  process.exit(1);
}

const json = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
const pkg = json?.client?.[0]?.client_info?.android_client_info?.package_name;
if (pkg !== 'com.caffelino.mobile') {
  console.warn(`WARNING: google-services.json package is "${pkg}", expected "com.caffelino.mobile"`);
}

fs.mkdirSync(path.dirname(androidDest), { recursive: true });
fs.copyFileSync(srcPath, rootDest);
fs.copyFileSync(srcPath, androidDest);

console.log('OK: google-services.json');
console.log('  →', rootDest);
console.log('  →', androidDest);
console.log('  package:', pkg);
