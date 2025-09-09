const fs = require('fs');
const path = require('path');

/**
 * Convert Token Studio format to Style Dictionary format
 * This script helps sync tokens between Figma Token Studio and Style Dictionary
 * Updated to support W3C DTCG format with $value and $type
 */

function convertTokenStudioToStyleDictionary(tokenStudioData) {
  const styleDictionaryTokens = {};
  
  // Handle W3C DTCG format with proper token set selection
  let tokenSet;
  
  // Check for W3C DTCG format structure and merge multiple token sets
  if (tokenStudioData.global) {
    tokenSet = { ...tokenStudioData.global };
    
    // Also merge global.v2 section if it exists
    if (tokenStudioData['global.v2']) {
      console.log('🔍 Found global.v2 section, merging with global...');
      // Deep merge function
      function deepMerge(target, source) {
        const result = { ...target };
        Object.keys(source).forEach(key => {
          if (source[key] && typeof source[key] === 'object' && !source[key].$value && !source[key].$type) {
            // If it's a nested object (not a token), merge recursively
            result[key] = deepMerge(result[key] || {}, source[key]);
          } else {
            // If it's a token or primitive value, replace
            result[key] = source[key];
          }
        });
        return result;
      }
      
      // Deep merge global.v2 into tokenSet
      tokenSet = deepMerge(tokenSet, tokenStudioData['global.v2']);
    }
  } else if (tokenStudioData.$tokens) {
    // W3C DTCG format with $tokens
    tokenSet = tokenStudioData.$tokens;
  } else {
    // Try to get the first available token set
    const availableTokenSets = Object.keys(tokenStudioData).filter(key => 
      !key.startsWith('$') && typeof tokenStudioData[key] === 'object'
    );
    
    if (availableTokenSets.length > 0) {
      tokenSet = tokenStudioData[availableTokenSets[0]];
    } else {
      throw new Error('No valid token set found in Token Studio data');
    }
  }
  
  if (!tokenSet) {
    throw new Error('No token set found in Token Studio data');
  }
  
  console.log('🔍 Found token set with keys:', Object.keys(tokenSet));
  
  // Helper function to normalize token names (replace spaces with dashes)
  // Updated to trigger GitHub Actions workflow
  function normalizeTokenName(name) {
    return name.replace(/\s+/g, '-').toLowerCase();
  }
  
  // Helper function to fix token references in values
  function fixTokenReferences(value, rootPath = []) {
    if (typeof value === 'string' && value.includes('{') && value.includes('}')) {
      // Handle token references like {Primitives Color.neutral.1} or {global.v2.primitives-color.neutral.2}
      return value.replace(/\{([^}]+)\}/g, (match, reference) => {
        // If reference starts with 'global.v2', remove it since we merged everything to root
        if (reference.startsWith('global.v2.')) {
          reference = reference.replace('global.v2.', '');
        }
        
        // Split reference by dots and normalize each part
        const parts = reference.split('.');
        const normalizedParts = parts.map(part => {
          // If part contains spaces, normalize it
          if (part.includes(' ')) {
            return normalizeTokenName(part);
          }
          return part;
        });
        
        // Return the normalized reference path
        return `{${normalizedParts.join('.')}}`;
      });
    }
    return value;
  }
  
  // Recursive function to process tokens
  function processTokens(obj, result = {}, currentPath = []) {
    for (const [key, value] of Object.entries(obj)) {
      // Skip metadata keys
      if (key.startsWith('$')) {
        continue;
      }
      
      // Normalize key name (replace spaces with dashes)
      const normalizedKey = normalizeTokenName(key);
      const newPath = [...currentPath, normalizedKey];
      
      if (value && typeof value === 'object' && (value.value !== undefined || value.$value !== undefined)) {
        // This is a token with a value (support both W3C DTCG $value and Token Studio value)
        let tokenValue = value.$value || value.value;
        const tokenType = value.$type || value.type;
        
        // Fix token references in the value
        tokenValue = fixTokenReferences(tokenValue); // No need for root path since we handle it internally
        
        console.log(`📝 Processing token: ${normalizedKey} = ${tokenValue} (type: ${tokenType})`);
        
        result[normalizedKey] = {
          value: convertValue(tokenValue, tokenType),
          type: convertType(tokenType)
        };
        
        // Preserve description if it exists
        if (value.description || value.$description) {
          result[normalizedKey].description = value.description || value.$description;
        }
        
      } else if (value && typeof value === 'object') {
        // This is a nested group
        console.log(`📁 Processing group: ${normalizedKey}`);
        result[normalizedKey] = {};
        processTokens(value, result[normalizedKey], newPath);
      }
    }
    return result;
  }
  
  // Convert values based on type
  function convertValue(value, type) {
    if (type === 'spacing' || type === 'borderRadius' || type === 'borderWidth' || type === 'fontSizes') {
      return `${value}px`;
    }
    
    if (type === 'boxShadow') {
      if (Array.isArray(value)) {
        // Multiple shadows
        return value.map(shadow => {
          return `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}`;
        }).join(', ');
      } else {
        // Single shadow
        return `${value.x}px ${value.y}px ${value.blur}px ${value.spread}px ${value.color}`;
      }
    }
    
    // Handle complex objects and fix reference mappings (including typography)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      try {
        // Fix references for all complex objects including typography tokens
        let correctedValue = JSON.stringify(value)
          .replace(/\{primary\}/g, '{telkomsel-batik-sans}')
          .replace(/\{secondary\}/g, '{poppins}');
        return JSON.parse(correctedValue);
      } catch (e) {
        return '[Complex Object]';
      }
    }
    
    return value;
  }
  
  // Convert token types
  function convertType(type) {
    const typeMap = {
      'fontSizes': 'fontSizes',
      'lineHeights': 'lineHeights', 
      'fontWeights': 'fontWeights',
      'fontFamilies': 'fontFamilies',
      'borderRadius': 'borderRadius',
      'borderWidth': 'borderWidth',
      'spacing': 'spacing',
      'color': 'color',
      'boxShadow': 'boxShadow',
      'typography': 'typography',
      'letterSpacing': 'letterSpacing',
      'textDecoration': 'textDecoration',
      'textCase': 'textCase',
      'asset': 'asset',
      'border': 'border',
      'text': 'text'
    };
    
    return typeMap[type] || type;
  }
  
  return processTokens(tokenSet, styleDictionaryTokens);
}

function convertStyleDictionaryToTokenStudio(styleDictionaryData) {
  const tokenStudioData = {
    global: {},
    $themes: [],
    $metadata: {
      tokenSetOrder: ['global']
    }
  };
  
  // Recursive function to process Style Dictionary tokens
  function processTokens(obj, result = {}) {
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && value.value !== undefined) {
        // This is a token with a value
        result[key] = {
          value: convertValueToTokenStudio(value.value, value.type),
          type: value.type
        };
      } else if (value && typeof value === 'object') {
        // This is a nested group
        result[key] = {};
        processTokens(value, result[key]);
      }
    }
    return result;
  }
  
  function convertValueToTokenStudio(value, type) {
    if (type === 'spacing' || type === 'borderRadius' || type === 'borderWidth' || type === 'fontSizes') {
      // Remove 'px' suffix for Token Studio
      return typeof value === 'string' ? value.replace('px', '') : value;
    }
    
    return value;
  }
  
  tokenStudioData.global = processTokens(styleDictionaryData);
  return tokenStudioData;
}

// Main execution
async function syncTokens(direction = 'figma-to-style') {
  try {
    if (direction === 'figma-to-style') {
      console.log('🔄 Converting Token Studio format to Style Dictionary...');
      
      // Get all JSON files from tokens directory
      const tokensDir = path.join(__dirname, 'tokens');
      
      if (!fs.existsSync(tokensDir)) {
        console.log('⚠️ Tokens directory not found, creating it...');
        fs.mkdirSync(tokensDir, { recursive: true });
        return;
      }
      
      const jsonFiles = fs.readdirSync(tokensDir)
        .filter(file => file.endsWith('.json'))
        .filter(file => !file.includes('-converted')) // Exclude converted files
        .filter(file => {
          // Only process files that look like Figma token files (check for token structure)
          try {
            const content = JSON.parse(fs.readFileSync(path.join(tokensDir, file), 'utf8'));
            // Check if it's already in Style Dictionary format (has .value and .type)
            // Don't confuse W3C DTCG format ($value, $type) with Style Dictionary format
            const hasStyleDictionaryFormat = Object.values(content).some(item => 
              typeof item === 'object' && item !== null && 
              (item.value !== undefined || item.type !== undefined) &&
              (item.$value === undefined && item.$type === undefined)
            );
            // Only process if it's NOT in Style Dictionary format (i.e., it's a Figma tokens file)
            return !hasStyleDictionaryFormat;
          } catch (e) {
            console.log(`⚠️ Skipping ${file} - invalid JSON:`, e.message);
            return false;
          }
        });
      
      if (jsonFiles.length === 0) {
        console.log('⚠️ No JSON files found in tokens directory');
        return;
      }
      
      console.log(`📁 Found ${jsonFiles.length} JSON files to process:`, jsonFiles);
      
      // Process each JSON file
      for (const jsonFile of jsonFiles) {
        const inputPath = path.join(tokensDir, jsonFile);
        const fileName = path.parse(jsonFile).name;
        
        console.log(`\n🔄 Processing ${jsonFile}...`);
        
        try {
          const tokenStudioData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
          
          // Check if file is empty or invalid
          if (!tokenStudioData || Object.keys(tokenStudioData).length === 0) {
            console.log(`⚠️ ${jsonFile} is empty, skipping conversion`);
            continue;
          }
          
          // Convert to Style Dictionary format
          const styleDictionaryTokens = convertTokenStudioToStyleDictionary(tokenStudioData);
          
          // Write converted file with original name prefix
          const outputPath = path.join(tokensDir, `${fileName}-converted.json`);
          console.log(`📝 Writing to: ${outputPath}`);
          console.log(`📊 Token count: ${Object.keys(styleDictionaryTokens).length}`);
          
          fs.writeFileSync(outputPath, JSON.stringify(styleDictionaryTokens, null, 2));
          
          // Verify file was written
          if (fs.existsSync(outputPath)) {
            console.log(`✅ Converted ${jsonFile} saved to ${fileName}-converted.json`);
          } else {
            console.log(`❌ Failed to write ${fileName}-converted.json`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing ${jsonFile}:`, error.message);
          continue;
        }
      }
      
      console.log('\n🔧 Run "npm run build" to generate CSS files for all converted tokens');
      
    } else if (direction === 'style-to-figma') {
      console.log('🔄 Converting Style Dictionary format to Token Studio...');
      
      // Read Style Dictionary file
      const styleDictionaryPath = path.join(__dirname, 'tokens', 'tokens.json');
      
      if (!fs.existsSync(styleDictionaryPath)) {
        console.log('⚠️ tokens/tokens.json not found, skipping conversion');
        return;
      }
      
      const styleDictionaryData = JSON.parse(fs.readFileSync(styleDictionaryPath, 'utf8'));
      
      // Convert to Token Studio format
      const tokenStudioData = convertStyleDictionaryToTokenStudio(styleDictionaryData);
      
      // Write to Token Studio file
      const outputPath = path.join(__dirname, 'figma-tokens.json');
      fs.writeFileSync(outputPath, JSON.stringify(tokenStudioData, null, 2));
      
      console.log('✅ Converted tokens saved to figma-tokens.json');
      console.log('🎨 Push to Figma using Token Studio plugin');
    }
    
  } catch (error) {
    console.error('❌ Error during conversion:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Command line usage
const direction = process.argv[2] || 'figma-to-style';

if (!['figma-to-style', 'style-to-figma'].includes(direction)) {
  console.log('Usage: node sync-tokens.js [figma-to-style|style-to-figma]');
  console.log('  figma-to-style: Convert all JSON files in tokens/ to Style Dictionary format');
  console.log('  style-to-figma: Convert tokens/tokens.json to figma-tokens.json');
  process.exit(1);
}

syncTokens(direction);

module.exports = { convertTokenStudioToStyleDictionary, convertStyleDictionaryToTokenStudio };
