const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'screens', 'Auth', 'SignUpFirstScreen.tsx');
let fileContent = fs.readFileSync(targetPath, 'utf8');

const returnRegex = /  return \([\s\S]*?\n\};\n\nconst styles = StyleSheet\.create\(\{[\s\S]*?\}\);\n\nexport default SignUpFirstScreen;\n/m;

const replacement = fs.readFileSync(path.join(__dirname, 'JSX_STYLES.txt'), 'utf8');

const newContent = fileContent.replace(returnRegex, replacement + '\n');
fs.writeFileSync(targetPath, newContent);
console.log('Successfully updated SignUpFirstScreen.tsx');
