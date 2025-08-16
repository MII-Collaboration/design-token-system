// Design Token Build System - Updated for GitHub Pages deployment
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
    const isVariablesFile = config.destination === 'variables.css';
    
    // Generate CSS variables
    let css = `:root {\n`;
    tokens.forEach(token => {
      // Remove 'global-v2-' prefix from token names
      const cleanName = token.name.replace(/^global-v2-/, '');
      css += `  --${cleanName}: ${token.value};\n`;
    });
    css += `}\n\n`;
    
    // If this is just the variables file, return only the CSS variables
    if (isVariablesFile) {
      return css;
    }

    // Add utility classes for colors
    css += `/* Color Utilities */\n`;
    tokens.filter(token => token.type === 'color').forEach(token => {
      const cleanName = token.name.replace(/^global-v2-/, '');
      const className = cleanName.replace(/\./g, '-');
      css += `.bg-${className} { background-color: var(--${cleanName}); }\n`;
      css += `.text-${className} { color: var(--${cleanName}); }\n`;
      css += `.border-${className} { border-color: var(--${cleanName}); }\n`;
    });

    // Add utility classes for spacing
    css += `\n/* Spacing Utilities */\n`;
    tokens.filter(token => token.type === 'spacing').forEach(token => {
      const cleanName = token.name.replace(/^global-v2-/, '');
      const className = cleanName.replace(/\./g, '-');
      css += `.p-${className} { padding: var(--${cleanName}); }\n`;
      css += `.pt-${className} { padding-top: var(--${cleanName}); }\n`;
      css += `.pr-${className} { padding-right: var(--${cleanName}); }\n`;
      css += `.pb-${className} { padding-bottom: var(--${cleanName}); }\n`;
      css += `.pl-${className} { padding-left: var(--${cleanName}); }\n`;
      css += `.px-${className} { padding-left: var(--${cleanName}); padding-right: var(--${cleanName}); }\n`;
      css += `.py-${className} { padding-top: var(--${cleanName}); padding-bottom: var(--${cleanName}); }\n`;
      css += `.m-${className} { margin: var(--${cleanName}); }\n`;
      css += `.mt-${className} { margin-top: var(--${cleanName}); }\n`;
      css += `.mr-${className} { margin-right: var(--${cleanName}); }\n`;
      css += `.mb-${className} { margin-bottom: var(--${cleanName}); }\n`;
      css += `.ml-${className} { margin-left: var(--${cleanName}); }\n`;
      css += `.mx-${className} { margin-left: var(--${cleanName}); margin-right: var(--${cleanName}); }\n`;
      css += `.my-${className} { margin-top: var(--${cleanName}); margin-bottom: var(--${cleanName}); }\n`;
    });

    // Add utility classes for typography
    css += `\n/* Typography Utilities */\n`;
    tokens.filter(token => token.type === 'fontSizes').forEach(token => {
      const cleanName = token.name.replace(/^global-v2-/, '');
      const className = cleanName.replace(/\./g, '-');
      css += `.text-${className} { font-size: var(--${cleanName}); }\n`;
    });

    tokens.filter(token => token.type === 'fontWeights').forEach(token => {
      const cleanName = token.name.replace(/^global-v2-/, '');
      const className = cleanName.replace(/\./g, '-');
      css += `.font-${className} { font-weight: var(--${cleanName}); }\n`;
    });

    tokens.filter(token => token.type === 'lineHeights').forEach(token => {
      const cleanName = token.name.replace(/^global-v2-/, '');
      const className = cleanName.replace(/\./g, '-');
      css += `.leading-${className} { line-height: var(--${cleanName}); }\n`;
    });

    // Add utility classes for border radius
    css += `\n/* Border Radius Utilities */\n`;
    tokens.filter(token => token.type === 'borderRadius').forEach(token => {
      const cleanName = token.name.replace(/^global-v2-/, '');
      const className = cleanName.replace(/\./g, '-');
      css += `.rounded-${className} { border-radius: var(--${cleanName}); }\n`;
    });

    // Add utility classes for shadows
    css += `\n/* Shadow Utilities */\n`;
    tokens.filter(token => token.type === 'boxShadow').forEach(token => {
      const cleanName = token.name.replace(/^global-v2-/, '');
      const className = cleanName.replace(/\./g, '-');
      css += `.shadow-${className} { box-shadow: var(--${cleanName}); }\n`;
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
  const baseName = path.parse(tokenFile).name;
  // Remove '-converted' suffix if it exists, otherwise use the original name
  const fileName = baseName.endsWith('-converted') ? baseName.replace('-converted', '') : baseName;
  
  return {
    source: [tokenFile],
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: `dist/css/${fileName}/`,
        files: [
          {
            destination: 'variables.css',
            format: 'css/variables-with-utilities'
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

// Function to get all token files (both converted and original)
function getConvertedTokenFiles() {
  const tokensDir = path.join(__dirname, 'tokens');
  
  if (!fs.existsSync(tokensDir)) {
    return [];
  }
  
  const allTokenFiles = fs.readdirSync(tokensDir)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(tokensDir, file));
  
  // Prioritize converted files, but include original files if no converted version exists
  const processedFiles = [];
  const convertedFiles = allTokenFiles.filter(file => file.includes('-converted.json'));
  const originalFiles = allTokenFiles.filter(file => !file.includes('-converted.json'));
  
  // Add all converted files
  processedFiles.push(...convertedFiles);
  
  // Add original files only if no converted version exists
  originalFiles.forEach(originalFile => {
    const baseName = path.parse(originalFile).name;
    const convertedVersion = convertedFiles.find(converted => 
      converted.includes(`${baseName}-converted.json`)
    );
    
    if (!convertedVersion) {
      processedFiles.push(originalFile);
    }
  });
  
  return processedFiles;
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
    const baseName = path.parse(tokenFile).name;
    const fileName = baseName.endsWith('-converted') ? baseName.replace('-converted', '') : baseName;
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
    const baseName = path.parse(tokenFile).name;
    const fileName = baseName.endsWith('-converted') ? baseName.replace('-converted', '') : baseName;
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
