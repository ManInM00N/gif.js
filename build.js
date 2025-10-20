const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // 读取版本号
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = pkg.version;
  const url = "https://github.com/jnordberg/gif.js";
  
  console.log(`Packaging gif.js ${version}`);
  
  // 检查 node_modules
  if (!fs.existsSync('./node_modules')) {
    console.error('Build dependencies missing. Run npm install');
    process.exit(1);
  }

  // 确保 dist 目录存在
  if (!fs.existsSync('./dist')) {
    fs.mkdirSync('./dist');
  }

  // 构建 gif.js
  console.log('Building gif.js...');
  execSync('npx browserify -d -s GIF -t coffeeify src/gif.coffee | npx exorcist dist/_gif.js.map > dist/_gif.js', { stdio: 'inherit' });
  
  // 使用 terser 替代 uglifyjs (兼容性更好)
  console.log('Minifying gif.js...');
  const preamble = `// gif.js ${version} - ${url}`;
  execSync(`npx terser dist/_gif.js --compress --mangle --source-map "content=dist/_gif.js.map,url=gif.js.map" --preamble "${preamble}" -o dist/gif.js`, { stdio: 'inherit' });

  // 构建 gif.worker.js
  console.log('Building gif.worker.js...');
  execSync('npx browserify -d -t coffeeify --bare src/gif.worker.coffee | npx exorcist dist/_gif.worker.js.map > dist/_gif.worker.js', { stdio: 'inherit' });
  
  console.log('Minifying gif.worker.js...');
  const workerPreamble = `// gif.worker.js ${version} - ${url}`;
  execSync(`npx terser dist/_gif.worker.js --compress --mangle --source-map "content=dist/_gif.worker.js.map,url=gif.worker.js.map" --preamble "${workerPreamble}" -o dist/gif.worker.js`, { stdio: 'inherit' });

  // 删除临时文件
  console.log('Cleaning up...');
  fs.readdirSync('dist').forEach(file => {
    if (file.startsWith('_')) {
      fs.unlinkSync(path.join('dist', file));
    }
  });

  console.log('✅ Build complete!');
  console.log('📦 Output files:');
  console.log('   - dist/gif.js');
  console.log('   - dist/gif.js.map');
  console.log('   - dist/gif.worker.js');
  console.log('   - dist/gif.worker.js.map');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}