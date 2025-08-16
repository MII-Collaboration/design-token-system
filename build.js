const StyleDictionary = require('style-dictionary');
const fs = require('fs');
const path = require('path');

// Custom transform for converting pixels to rem
StyleDictionary.registerTransform({
  name: 'size/pxToRem',
  type: 'value',
  matcher: function(token) {
    return ['spacing', 'fontSizes', 'borderRadius', 'borderWidth'].includes(token.type) && 
           typeof token.value === 'string' && 
           token.value.endsWith('px');
  },
  transformer: function(token) {
    const val = parseFloat(token.value);
    if (isNaN(val)) return token.value;
    return `${val / 16}rem`;
  }
});

// Custom format for CSS with utility classes
StyleDictionary.registerFormat({
  name: 'css/variables-with-utilities',
  formatter: function(dictionary, config) {
    const tokens = dictionary.allTokens;
    
    let css = `:root {\n`;
    tokens.forEach(token => {
      css += `  --${token.name}: ${token.value};\n`;
    });
    css += `}\n\n`;

    // Add utility classes for colors
    css += `/* Color Utilities */\n`;
    tokens.filter(token => token.type === 'color').forEach(token => {
      const className = token.name.replace(/\./g, '-');
      css += `.bg-${className} { background-color: var(--${token.name}); }\n`;
      css += `.text-${className} { color: var(--${token.name}); }\n`;
      css += `.border-${className} { border-color: var(--${token.name}); }\n`;
    });

    // Add utility classes for spacing
    css += `\n/* Spacing Utilities */\n`;
    tokens.filter(token => token.type === 'spacing').forEach(token => {
      const className = token.name.replace(/\./g, '-');
      css += `.p-${className} { padding: var(--${token.name}); }\n`;
      css += `.pt-${className} { padding-top: var(--${token.name}); }\n`;
      css += `.pr-${className} { padding-right: var(--${token.name}); }\n`;
      css += `.pb-${className} { padding-bottom: var(--${token.name}); }\n`;
      css += `.pl-${className} { padding-left: var(--${token.name}); }\n`;
      css += `.px-${className} { padding-left: var(--${token.name}); padding-right: var(--${token.name}); }\n`;
      css += `.py-${className} { padding-top: var(--${token.name}); padding-bottom: var(--${token.name}); }\n`;
      css += `.m-${className} { margin: var(--${token.name}); }\n`;
      css += `.mt-${className} { margin-top: var(--${token.name}); }\n`;
      css += `.mr-${className} { margin-right: var(--${token.name}); }\n`;
      css += `.mb-${className} { margin-bottom: var(--${token.name}); }\n`;
      css += `.ml-${className} { margin-left: var(--${token.name}); }\n`;
      css += `.mx-${className} { margin-left: var(--${token.name}); margin-right: var(--${token.name}); }\n`;
      css += `.my-${className} { margin-top: var(--${token.name}); margin-bottom: var(--${token.name}); }\n`;
    });

    // Add utility classes for typography
    css += `\n/* Typography Utilities */\n`;
    tokens.filter(token => token.type === 'fontSizes').forEach(token => {
      const className = token.name.replace(/\./g, '-');
      css += `.text-${className} { font-size: var(--${token.name}); }\n`;
    });

    tokens.filter(token => token.type === 'fontWeights').forEach(token => {
      const className = token.name.replace(/\./g, '-');
      css += `.font-${className} { font-weight: var(--${token.name}); }\n`;
    });

    // Add utility classes for border radius
    css += `\n/* Border Radius Utilities */\n`;
    tokens.filter(token => token.type === 'borderRadius').forEach(token => {
      const className = token.name.replace(/\./g, '-');
      css += `.rounded-${className} { border-radius: var(--${token.name}); }\n`;
    });

    // Add utility classes for shadows
    css += `\n/* Shadow Utilities */\n`;
    tokens.filter(token => token.type === 'boxShadow').forEach(token => {
      const className = token.name.replace(/\./g, '-');
      css += `.shadow-${className} { box-shadow: var(--${token.name}); }\n`;
    });

    return css;
  }
});

// Custom format for TypeScript definitions
StyleDictionary.registerFormat({
  name: 'typescript/definitions',
  formatter: function(dictionary) {
    const buildTokenInterface = (obj, indent = '') => {
      let result = '';
      for (const [key, value] of Object.entries(obj)) {
        if (value.value !== undefined) {
          result += `${indent}  ${key}: {\n`;
          result += `${indent}    value: string;\n`;
          result += `${indent}    type: '${value.type}';\n`;
          result += `${indent}  };\n`;
        } else {
          result += `${indent}  ${key}: {\n`;
          result += buildTokenInterface(value, indent + '  ');
          result += `${indent}  };\n`;
        }
      }
      return result;
    };

    const tokens = dictionary.tokens;
    
    return `// Generated design token types
export interface DesignTokens {
${buildTokenInterface(tokens)}
}

export declare const tokens: DesignTokens;
export default tokens;
`;
  }
});

// Register a custom transform group
StyleDictionary.registerTransformGroup({
  name: 'custom/css',
  transforms: ['attribute/cti', 'name/cti/kebab', 'time/seconds', 'content/icon', 'size/rem', 'color/css']
});

// Function to create config for specific token file
function createConfigForFile(tokenFile) {
  const fileName = path.parse(tokenFile).name.replace('-converted', '');
  
  return {
    source: [tokenFile],
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: `dist/css/${fileName}/`,
        files: [
          {
            destination: 'variables.css',
            format: 'css/variables'
          },
          {
            destination: 'utilities.css',
            format: 'css/variables-with-utilities'
          }
        ]
      },
      scss: {
        transformGroup: 'scss',
        buildPath: `dist/scss/${fileName}/`,
        files: [{
          destination: '_variables.scss',
          format: 'scss/variables'
        }]
      },
      js: {
        transformGroup: 'js',
        buildPath: `dist/js/${fileName}/`,
        files: [
          {
            destination: 'tokens.js',
            format: 'javascript/es6'
          },
          {
            destination: 'tokens.d.ts',
            format: 'typescript/definitions'
          }
        ]
      },
      json: {
        transformGroup: 'js',
        buildPath: `dist/json/${fileName}/`,
        files: [{
          destination: 'tokens.json',
          format: 'json'
        }]
      }
    }
  };
}

// Function to get all converted token files
function getConvertedTokenFiles() {
  const tokensDir = path.join(__dirname, 'tokens');
  
  if (!fs.existsSync(tokensDir)) {
    return [];
  }
  
  return fs.readdirSync(tokensDir)
    .filter(file => file.endsWith('-converted.json'))
    .map(file => path.join(tokensDir, file));
}

// Build function
function buildTokens() {
  console.log('🎨 Building design tokens from multiple files...');
  
  // Clean build directory
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  
  const tokenFiles = getConvertedTokenFiles();
  
  if (tokenFiles.length === 0) {
    console.log('⚠️ No converted token files found. Run "npm run sync:from-figma" first.');
    return;
  }
  
  console.log(`📁 Found ${tokenFiles.length} token files to build:`);
  
  let successCount = 0;
  let errorCount = 0;
  
  tokenFiles.forEach(tokenFile => {
    const fileName = path.parse(tokenFile).name.replace('-converted', '');
    console.log(`\n🔨 Building tokens from: ${fileName}`);
    
    try {
      const config = createConfigForFile(tokenFile);
      const styleDictionary = StyleDictionary.extend(config);
      
      styleDictionary.buildAllPlatforms();
      
      console.log(`✅ ${fileName} built successfully!`);
      console.log(`   📂 Output folder: dist/*/${fileName}/`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Error building ${fileName}:`, error.message);
      errorCount++;
    }
  });
  
  console.log(`\n🎉 Build completed!`);
  console.log(`✅ Success: ${successCount} files`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} files`);
  }
  
  console.log('\n📁 Generated file structure:');
  tokenFiles.forEach(tokenFile => {
    const fileName = path.parse(tokenFile).name.replace('-converted', '');
    console.log(`   📂 dist/css/${fileName}/variables.css`);
    console.log(`   📂 dist/css/${fileName}/utilities.css`);
    console.log(`   📂 dist/scss/${fileName}/_variables.scss`);
    console.log(`   📂 dist/js/${fileName}/tokens.js`);
    console.log(`   📂 dist/json/${fileName}/tokens.json`);
  });
}

// Run if called directly
if (require.main === module) {
  buildTokens();
}

module.exports = {
  buildTokens,
  StyleDictionary
};
