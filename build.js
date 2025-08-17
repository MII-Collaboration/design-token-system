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

// Custom transform for clean CSS variable names
StyleDictionary.registerTransform({
  name: 'name/css-clean',
  type: 'name',
  transformer: function(token, options) {
    // Get the path array and join with dashes
    let name = token.path.join('-').toLowerCase();
    
    // Remove common prefixes that might cause issues
    name = name.replace(/^(global-v2-|figma-tokens-|my-custom-tokens-)/, '');
    
    // Simplify color naming by removing redundant prefixes
    name = name.replace(/^primitives-color-/, 'color-');
    name = name.replace(/^semantics-color-/, 'color-');
    name = name.replace(/^gradients-color-/, 'gradient-');
    
    // Simplify typography naming
    name = name.replace(/^display-/, 'font-size-display-');
    name = name.replace(/^heading-/, 'font-size-');
    name = name.replace(/^body-/, 'font-size-body-');
    name = name.replace(/^label-/, 'font-size-label-');
    name = name.replace(/^caption-/, 'font-size-caption-');
    name = name.replace(/^hyperlink-/, 'font-size-hyperlink-');
    
    // Font weight simplification
    if (name === 'thin') name = 'font-thin';
    if (name === 'extra-light') name = 'font-extra-light';
    if (name === 'light') name = 'font-light';
    if (name === 'regular') name = 'font-regular';
    if (name === 'medium') name = 'font-medium';
    if (name === 'semi-bold') name = 'font-semi-bold';
    if (name === 'bold') name = 'font-bold';
    if (name === 'extra-bold') name = 'font-extra-bold';
    if (name === 'black') name = 'font-black';
    
    // Clean up any double dashes or invalid characters
    name = name.replace(/--+/g, '-');
    name = name.replace(/[^a-z0-9-]/g, '-');
    name = name.replace(/^-+|-+$/g, '');
    
    return name;
  }
});



// Custom format for CSS with utility classes
StyleDictionary.registerFormat({
  name: 'css/variables-with-utilities',
  formatter: function(dictionary, config) {
    const isVariablesFile = config.destination === 'variables.css';
    const tokens = dictionary.allTokens;
    
    // Group shadow tokens and create complete CSS shadow values
    const shadowGroups = {};
    const processedTokens = [];
    
    tokens.forEach(token => {
      // Check if this is a shadow component token with layer support
      const shadowMatch = token.path.join('.').match(/^(.+\.shadow\.[^.]+)(?:\.(\d+))?\.?(x|y|blur|spread|color|type)$/);
      
      if (shadowMatch) {
        const shadowBasePath = shadowMatch[1];
        const layer = shadowMatch[2] || '0'; // Default to layer 0 if no layer specified
        const component = shadowMatch[3];
        const shadowKey = `${shadowBasePath}.${layer}`;
        
        if (!shadowGroups[shadowKey]) {
          shadowGroups[shadowKey] = { basePath: shadowBasePath, layer: layer };
        }
        shadowGroups[shadowKey][component] = token.value;
      } else {
        processedTokens.push(token);
      }
    });
    
    // Group shadow layers by base path
    const shadowsByBase = {};
    Object.entries(shadowGroups).forEach(([shadowKey, components]) => {
      const basePath = components.basePath;
      if (!shadowsByBase[basePath]) {
        shadowsByBase[basePath] = {};
      }
      shadowsByBase[basePath][components.layer] = components;
    });
    
    // Convert shadow groups to complete CSS shadow values
    Object.entries(shadowsByBase).forEach(([basePath, layers]) => {
      const shadowLayers = [];
      
      // Sort layers by number and create shadow values
      Object.keys(layers).sort((a, b) => parseInt(a) - parseInt(b)).forEach(layerNum => {
        const components = layers[layerNum];
        
        if (components.x !== undefined && components.y !== undefined) {
          const x = components.x || 0;
          const y = components.y || 0;
          const blur = components.blur || 0;
          const spread = components.spread || 0;
          const color = components.color || 'rgba(0, 0, 0, 0.1)';
          const type = components.type || 'dropShadow';
          
          let shadowValue;
          if (type === 'innerShadow') {
            shadowValue = `inset ${x}px ${y}px ${blur}px ${spread}px ${color}`;
          } else {
            shadowValue = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
          }
          
          shadowLayers.push(shadowValue);
        }
      });
      
      if (shadowLayers.length > 0) {
        // Create a clean shadow token name
        const shadowName = basePath.replace(/\./g, '-').replace(/^global-v2-/, '');
        
        processedTokens.push({
          name: shadowName,
          value: shadowLayers.join(', '),
          type: 'boxShadow',
          path: basePath.split('.')
        });
      }
    });
    
    // Generate CSS variables
    let css = `:root {\n`;
    
    // Group tokens by category for organized comments
    const tokensByCategory = {
      'Typography - Size': [],
      'Typography - Weight': [],
      'Typography - Line Height': [],
      'Typography - Letter Spacing': [],
      'Typography - Font Family': [],
      'Color - Brand': [],
      'Color - Focus': [],
      'Color - Extended': [],
      'Color - Gradients': [],
      'Border': [],
      'Spacing': [],
      'Shadow': [],
      'Other': []
    };
    
    processedTokens.forEach(token => {
      const name = token.name;
      
      // Typography - Size (font sizes)
      if (name.includes('font-size-')) {
        tokensByCategory['Typography - Size'].push(token);
      }
      // Typography - Weight (font weights)
      else if (name.startsWith('font-') && (name.includes('thin') || name.includes('light') || name.includes('regular') || name.includes('medium') || name.includes('bold') || name.includes('black'))) {
        tokensByCategory['Typography - Weight'].push(token);
      }
      // Typography - Line Height (line heights) - only exact matches without other prefixes
      else if ((name === 'xs' || name === 'sm' || name === 'xl' || name === '2xl' || name === '3xl' || name === '4xl' || name === '5xl' || name === '6xl' || name === '7xl') && !name.includes('space') && !name.includes('font-size')) {
        tokensByCategory['Typography - Line Height'].push(token);
      }
      // Typography - Letter Spacing
      else if (name.includes('letterspacing')) {
        tokensByCategory['Typography - Letter Spacing'].push(token);
      }
      // Typography - Font Family
      else if ((name === 'primary' || name === 'secondary' || name === 'telkomse-batik-sans') && !name.includes('color')) {
        tokensByCategory['Typography - Font Family'].push(token);
      }
      // Color - Brand (primary, secondary colors)
      else if (name.startsWith('color-') && (name.includes('primary') || name.includes('secondary'))) {
        tokensByCategory['Color - Brand'] = tokensByCategory['Color - Brand'] || [];
        tokensByCategory['Color - Brand'].push(token);
      }
      // Color - Focus
      else if (name.startsWith('color-focus')) {
        tokensByCategory['Color - Focus'] = tokensByCategory['Color - Focus'] || [];
        tokensByCategory['Color - Focus'].push(token);
      }
      // Color - Extended (other colors)
      else if (name.startsWith('color-') && !name.includes('primary') && !name.includes('secondary') && !name.includes('focus')) {
        tokensByCategory['Color - Extended'] = tokensByCategory['Color - Extended'] || [];
        tokensByCategory['Color - Extended'].push(token);
      }
      // Gradients
      else if (name.startsWith('gradient-')) {
        tokensByCategory['Color - Gradients'] = tokensByCategory['Color - Gradients'] || [];
        tokensByCategory['Color - Gradients'].push(token);
      }
      // Border
      else if (name.includes('border-')) {
        tokensByCategory['Border'].push(token);
      }
      // Spacing
      else if (name.includes('space-')) {
        tokensByCategory['Spacing'].push(token);
      }
      // Shadow
      else if (name.includes('shadow-')) {
        tokensByCategory['Shadow'].push(token);
      }
      // Other
      else {
        tokensByCategory['Other'].push(token);
      }
    });
    
    // Generate CSS with organized comments
    Object.entries(tokensByCategory).forEach(([category, tokens]) => {
      if (tokens.length > 0) {
        css += `  /*! ${category} */\n`;
        tokens.forEach(token => {
          css += `  --${token.name}: ${token.value};\n`;
        });
        css += `\n`;
      }
    });
    
    css += `}\n\n`;
    
    // If this is just the variables file, return only the CSS variables
    if (isVariablesFile) {
      return css;
    }

    // Add utility classes for colors
    css += `/* Color Utilities */\n`;
    processedTokens.filter(token => token.type === 'color').forEach(token => {
      const className = token.name.replace(/\./g, '-');
      css += `.bg-${className} { background-color: var(--${token.name}); }\n`;
      css += `.text-${className} { color: var(--${token.name}); }\n`;
      css += `.border-${className} { border-color: var(--${token.name}); }\n`;
    });

    // Add utility classes for spacing
    css += `\n/* Spacing Utilities */\n`;
    processedTokens.filter(token => token.type === 'spacing').forEach(token => {
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
    processedTokens.filter(token => token.type === 'fontSizes').forEach(token => {
      const className = token.name.replace(/\./g, '-');
      css += `.text-${className} { font-size: var(--${token.name}); }\n`;
    });

    processedTokens.filter(token => token.type === 'fontWeights').forEach(token => {
      const cleanName = token.name.replace(/^global-v2-/, '');
      const className = cleanName.replace(/\./g, '-');
      css += `.font-${className} { font-weight: var(--${cleanName}); }\n`;
    });

    processedTokens.filter(token => token.type === 'lineHeights').forEach(token => {
      const cleanName = token.name.replace(/^global-v2-/, '');
      const className = cleanName.replace(/\./g, '-');
      css += `.leading-${className} { line-height: var(--${cleanName}); }\n`;
    });

    // Add utility classes for border radius
    css += `\n/* Border Radius Utilities */\n`;
    processedTokens.filter(token => token.type === 'borderRadius').forEach(token => {
      const cleanName = token.name.replace(/^global-v2-/, '');
      const className = cleanName.replace(/\./g, '-');
      css += `.rounded-${className} { border-radius: var(--${cleanName}); }\n`;
    });

    // Add utility classes for shadows
    css += `\n/* Shadow Utilities */\n`;
    processedTokens.filter(token => token.type === 'boxShadow').forEach(token => {
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
  transforms: ['attribute/cti', 'name/css-clean', 'time/seconds', 'content/icon', 'size/pxToRem', 'color/css']
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
        transformGroup: 'custom/css',
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
  
  // Backup index.html if it exists
  let indexHtmlContent = null;
  const indexPath = path.join('dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    indexHtmlContent = fs.readFileSync(indexPath, 'utf8');
    console.log('📄 Backing up existing index.html');
  }
  
  // Clean build directory
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  
  // Restore index.html if it was backed up
  if (indexHtmlContent) {
    fs.mkdirSync('dist', { recursive: true });
    fs.writeFileSync(indexPath, indexHtmlContent);
    console.log('📄 Restored index.html');
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
