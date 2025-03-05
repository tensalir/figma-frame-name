# Developer Documentation: Asset Name Plugin

This document provides detailed technical information for developers who want to understand, maintain, or extend the Asset Name Plugin for Figma.

## Architecture Overview

The plugin follows a simple but effective architecture:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  UI Interface   │────▶│  Core Logic     │────▶│  Figma API      │
│  (ui.html)      │     │  (code.js)      │     │  Interactions   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Key Components

1. **UI Layer** (`ui.html`):
   - Settings panel for customizing plugin behavior
   - Event handling for UI interactions
   - Communication with the main plugin code

2. **Core Logic** (`code.js`):
   - Asset detection algorithms
   - Text creation and positioning
   - Visual styling calculation
   - Background detection
   - Command handling

3. **Plugin Configuration** (`manifest.json`):
   - Plugin metadata
   - Command definitions
   - Entry points

## Technical Implementation Details

### Asset Detection

The asset detection uses a recursive depth-first search algorithm to find all imported images within the selection or page:

```javascript
function findAssets(nodes) {
  // Uses a nested recursive function to search deeply
  function searchDeep(nodes, depth) {
    // For each node, check if it's an image
    // If it's a container (frame, group, etc.), search within it
  }
  
  // Start the deep search and return unique assets
  return uniqueAssets;
}
```

Key features:
- Detects both direct IMAGE nodes and shapes with image fills
- Prevents duplicate processing using an ID tracking system
- Handles complex nesting (frames within frames, groups within groups)
- Provides detailed logging for debugging

### Text Generation and Positioning

The plugin creates text labels using these primary steps:

1. **Font Loading**:
```javascript
await figma.loadFontAsync({ family: "Inter", style: "Regular" });
```

2. **Text Creation**:
```javascript
var textNode = figma.createText();
textNode.characters = displayName;
```

3. **Adaptive Styling**:
```javascript
// Size calculation
var sizeFactor = asset.width / 28.44;
var fontSize = Math.max(Math.min(Math.round(sizeFactor), 400), 8);

// Color adaptation based on background luminance
var luminance = 0.299 * bgColor.r + 0.587 * bgColor.g + 0.114 * bgColor.b;
var textColor = luminance < 0.5 ? lightColor : darkColor;

// Apply styling
textNode.fontSize = fontSize;
textNode.fills = [{ type: 'SOLID', color: textColor }];
```

4. **Positioning**:
```javascript
textNode.textAlignHorizontal = 'CENTER';
textNode.x = asset.x;
textNode.y = asset.y + asset.height + 10;

// Center horizontally
textNode.x = asset.x + (asset.width - textNode.width) / 2;
```

### Event Handling

The plugin handles two primary event paths:

1. **Command Execution**:
   - `addNamesToSelected`: Processes selected nodes and any contained assets
   - `addNamesToAll`: Processes all nodes on the current page

2. **UI Interactions**:
   - Settings changes
   - Button clicks
   - Styling adjustments

### Background Color Detection

The background detection uses luminance calculation to determine if the background is dark or light:

```javascript
// Get background color (page or parent)
var bgColor = getBgColor();

// Calculate luminance (standard formula)
var luminance = 0.299 * bgColor.r + 0.587 * bgColor.g + 0.114 * bgColor.b;

// Choose appropriate text color
var textColor = luminance < 0.5 ? 
  { r: 251/255, g: 249/255, b: 248/255 } : // Light text for dark bg
  { r: 37/255, g: 36/255, b: 39/255 };     // Dark text for light bg
```

## Future Development and Extension Points

### Auto-Detection Enhancement

To implement automatic detection on import:

1. Leverage the document change listener:
```javascript
figma.on('documentchange', function(event) {
  // Check for CREATE operations
  // Process newly created assets
});
```

2. Add a mutation observer for the selection:
```javascript
figma.on('selectionchange', function() {
  // Check if selection includes newly imported assets
});
```

### Adding New Text Styles

To add new text styling options:

1. Update the settings object:
```javascript
var settings = {
  // Existing settings
  fontWeight: "Regular",
  fontStyle: "Normal",
  // Other new properties
};
```

2. Extend the UI to include new controls

3. Update the text creation function:
```javascript
await figma.loadFontAsync({ 
  family: settings.fontFamily, 
  style: settings.fontWeight
});

// Apply additional styles
textNode.fontWeight = settings.fontWeight;
textNode.textCase = settings.textCase;
// etc.
```

### Performance Optimization

For handling large documents with many assets:

1. Implement pagination for processing:
```javascript
function processInBatches(assets, batchSize) {
  // Process assets in smaller batches with delays
  // to prevent UI freezing
}
```

2. Add cancellation support for long-running operations

## Troubleshooting Common Issues

### Text Not Appearing

1. Check font loading:
```javascript
try {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
} catch (err) {
  console.error("Font loading failed:", err);
  // Fallback to a system font
}
```

2. Verify text node creation:
```javascript
var textNode = figma.createText();
if (!textNode) {
  throw new Error("Failed to create text node");
}
```

### Asset Detection Problems

1. Enable verbose logging:
```javascript
var DEBUG = true;

function log(message) {
  if (DEBUG) console.log(message);
}

// Use throughout code
log("Checking node: " + node.type);
```

2. Add node type checking:
```javascript
console.log("Node types in selection:");
selection.forEach(node => console.log(node.type));
```

## Resources

- [Figma Plugin API Documentation](https://www.figma.com/plugin-docs/)
- [JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Color Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

## Plugin Submission Requirements

When submitting to the Figma Community:

1. Create a compelling cover image
2. Write a clear, concise description
3. Record a short demo video
4. Include usage instructions
5. Set appropriate tags

## Conclusion

This Asset Name Plugin provides a solid foundation that can be extended in numerous ways. By understanding the core architecture and implementation details, developers can easily build upon this codebase to add new features or customize existing functionality.

For any questions or contributions, please open an issue or submit a pull request on the GitHub repository.