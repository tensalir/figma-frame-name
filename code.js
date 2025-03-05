// Asset Name Plugin for Figma
// This plugin automatically adds the filename of imported assets underneath them

// Default settings
var settings = {
  fontSize: 10,
  fontColor: { r: 0, g: 0, b: 0 },
  fontFamily: "Inter",
  offset: 10, // vertical spacing between asset and label
  applyToGroups: true,
  autoLabel: true // automatic labeling of new assets
};

// Load settings from client storage
async function loadSettings() {
  var savedSettings = await figma.clientStorage.getAsync('assetNamePluginSettings');
  if (savedSettings) {
    // Update settings with saved values without using spread operator
    for (var key in savedSettings) {
      if (savedSettings.hasOwnProperty(key)) {
        settings[key] = savedSettings[key];
      }
    }
  }
}

// Save settings to client storage
async function saveSettings(newSettings) {
  // Update settings with new values without using spread operator
  for (var key in newSettings) {
    if (newSettings.hasOwnProperty(key)) {
      settings[key] = newSettings[key];
    }
  }
  await figma.clientStorage.setAsync('assetNamePluginSettings', settings);
}

// Track recently created nodes to detect imports
var recentNodes = [];
var processingImport = false;

// Find assets that can have names added - only consider imported images
// Deeply searches through nested structures to find all images
function findAssets(nodes) {
  var assets = [];
  
  // Debug info
  console.log("Searching for imported images in " + nodes.length + " nodes");
  
  function isImageNode(node) {
    // Check if this is a direct image node
    if (node.type === 'IMAGE') {
      return true;
    }
    
    // Check for rectangles with image fills
    if ((node.type === 'RECTANGLE' || node.type === 'ELLIPSE') && node.fills) {
      for (var j = 0; j < node.fills.length; j++) {
        if (node.fills[j] && node.fills[j].type === 'IMAGE') {
          return true;
        }
      }
    }
    
    return false;
  }
  
  function searchDeep(nodes, depth) {
    if (!nodes || nodes.length === 0) return;
    
    depth = depth || 0;
    var indent = "  ".repeat(depth);
    
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      
      // Skip if node is null or undefined
      if (!node) continue;
      
      // Skip text nodes
      if (node.type === 'TEXT') {
        continue;
      }
      
      // Check if this node itself is an image
      if (isImageNode(node)) {
        console.log(indent + "Found imported image: " + node.name);
        assets.push(node);
      }
      
      // Special handling for frames: check inside for images that are direct children
      if ((node.type === 'FRAME' || node.type === 'GROUP' || 
           node.type === 'COMPONENT' || node.type === 'INSTANCE') && 
          node.children && node.children.length > 0) {
        
        console.log(indent + "Checking inside " + node.type + ": " + node.name);
        
        // First look for immediate children that are images
        for (var j = 0; j < node.children.length; j++) {
          var child = node.children[j];
          
          if (isImageNode(child)) {
            console.log(indent + "  Found direct child image: " + child.name);
            assets.push(child);
          }
        }
        
        // Then recursively search deeper
        searchDeep(node.children, depth + 1);
      }
    }
  }
  
  // Start the deep search
  searchDeep(nodes, 0);
  
  console.log("Found " + assets.length + " total imported images");
  return assets;
}

// Check if an asset already has a label
function hasLabel(asset) {
  // If asset doesn't have a parent, it can't have a label
  if (!asset.parent) {
    return false;
  }
  
  // Look for text nodes that are siblings of this asset and positioned below it
  var siblings = asset.parent.children;
  var assetBottom = asset.y + asset.height;
  
  for (var i = 0; i < siblings.length; i++) {
    var sibling = siblings[i];
    
    // Check if it's a text node positioned near the bottom of this asset
    if (sibling.type === 'TEXT' && 
        sibling.y > asset.y + asset.height && 
        sibling.y < asset.y + asset.height + 20 &&
        sibling.x > asset.x - 20 && 
        sibling.x < asset.x + asset.width + 20) {
      
      return true;
    }
  }
  
  return false;
}

// Create text label for an asset
async function createLabel(asset) {
  try {
    // Log asset info for debugging
    console.log("Creating label for: " + asset.name + " (type: " + asset.type + ")");
    console.log("Asset dimensions: " + asset.width + " x " + asset.height);
    
    // Load a system font that should be available
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    
    // Create a text node
    var textNode = figma.createText();
    
    // Make sure we actually get a text node
    if (!textNode) {
      throw new Error("Failed to create text node");
    }
    
    // Get the name from the asset (removing extension if present)
    var displayName = asset.name.replace(/\.[^/.]+$/, "");
    
    // Set the text content - must happen after font loading
    textNode.characters = displayName;
    
    // Calculate font size truly proportional to the image dimensions
    // For a very large image like 8532x13547, we want font size around 300
    // Calculate based on the width, with a maximum reasonable size
    var sizeFactor = asset.width / 28.44; // This ratio gives 300 for width 8532
    var fontSize = Math.max(Math.min(Math.round(sizeFactor), 400), 8); // Min 8, max 400
    
    console.log("Calculated font size: " + fontSize + " (based on width: " + asset.width + ")");
    
    // Check the background color to determine text color
    // We'll check the page background or parent background
    var bgColor;
    
    if (figma.currentPage.backgrounds && figma.currentPage.backgrounds.length > 0) {
      // Get page background color
      bgColor = figma.currentPage.backgrounds[0].color;
    } else if (asset.parent && asset.parent.fills && asset.parent.fills.length > 0) {
      // Get parent background if available
      for (var i = 0; i < asset.parent.fills.length; i++) {
        if (asset.parent.fills[i].type === 'SOLID') {
          bgColor = asset.parent.fills[i].color;
          break;
        }
      }
    }
    
    // Determine if background is dark or light
    var textColor;
    if (bgColor) {
      // Calculate luminance: 0.299*R + 0.587*G + 0.114*B
      var luminance = 0.299 * bgColor.r + 0.587 * bgColor.g + 0.114 * bgColor.b;
      
      if (luminance < 0.5) {
        // Dark background - use light text #FBF9F8
        textColor = { r: 251/255, g: 249/255, b: 248/255 };
        console.log("Using light text color for dark background");
      } else {
        // Light background - use dark text #252427
        textColor = { r: 37/255, g: 36/255, b: 39/255 };
        console.log("Using dark text color for light background");
      }
    } else {
      // Default to dark text if we can't determine the background
      textColor = { r: 37/255, g: 36/255, b: 39/255 };
      console.log("Using default dark text color");
    }
    
    // Apply styling
    textNode.fontSize = fontSize;
    textNode.fills = [{ type: 'SOLID', color: textColor }];
    
    // Set text properties to ensure no background/fill appears
    if (textNode.fills) {
      // Make sure only the text has a fill, not its background
      textNode.fills = [{ type: 'SOLID', color: textColor }];
    }
    
    // Text nodes shouldn't have backgrounds, but just to be safe
    if ('backgrounds' in textNode) {
      textNode.backgrounds = [];
    }
    
    // Make sure there are no effect styles that might create shadows or backgrounds
    textNode.effects = [];
    
    // Set the text alignment to center
    textNode.textAlignHorizontal = 'CENTER';
    
    // Position directly underneath the asset
    // First place it at the asset's X position
    textNode.x = asset.x;
    textNode.y = asset.y + asset.height + 10;
    
    // Add the text node to the same parent as the asset
    var parent = asset.parent;
    if (parent) {
      parent.appendChild(textNode);
    } else {
      // If no parent, add to current page
      figma.currentPage.appendChild(textNode);
    }
    
    // Now center it - calculate the center position based on asset width and text width
    // This has to be done after adding to the document so text width is calculated
    textNode.x = asset.x + (asset.width - textNode.width) / 2;
    
    // Create a small delay to ensure correct positioning
    setTimeout(function() {
      // Double-check and adjust centering
      textNode.x = asset.x + (asset.width - textNode.width) / 2;
    }, 10);
    
    figma.notify("Added label to image: " + displayName);
    
    // Return both the original asset and the text node
    return {
      asset: asset,
      label: textNode
    };
  } catch (err) {
    console.error("Error creating label:", err);
    figma.notify("Error creating label: " + err.message);
    return { asset: asset, label: null }; // Return just the asset with no label
  }
}

// Add names to assets
async function addNamesToAssets(assets) {
  var processedAssets = [];
  
  for (var i = 0; i < assets.length; i++) {
    var asset = assets[i];
    // Skip if this asset already has a label
    if (hasLabel(asset)) {
      continue;
    }
    
    var result = await createLabel(asset);
    if (result && result.label) {
      processedAssets.push(result);
    }
  }
  
  return processedAssets;
}

// Handle newly created nodes (potential imports)
async function handleNodeCreation(event) {
  // If auto-labeling is disabled, exit
  if (!settings.autoLabel) return;
  
  // Skip if we're already processing nodes to avoid loops
  if (processingImport) return;
  
  processingImport = true;
  
  try {
    // Get nodes from the creation event or from selection
    var nodesToCheck = (event && event.node) ? [event.node] : figma.currentPage.selection;
    
    // Find assets among the new nodes
    var assets = findAssets(nodesToCheck);
    
    if (assets.length > 0) {
      // Add names to the assets
      await loadSettings();
      await addNamesToAssets(assets);
      
      if (assets.length === 1) {
        figma.notify('Added label to 1 newly imported asset');
      } else if (assets.length > 1) {
        figma.notify('Added labels to ' + assets.length + ' newly imported assets');
      }
    }
  } catch (error) {
    console.error('Error handling node creation:', error);
  } finally {
    processingImport = false;
  }
}

// Setup document listeners for auto-labeling
function setupAutoLabelingListeners() {
  // Listen for node creation
  figma.on('documentchange', function(event) {
    // Check if the event includes creation
    var hasCreation = false;
    var createdNodes = [];
    
    for (var i = 0; i < event.documentChanges.length; i++) {
      var change = event.documentChanges[i];
      if (change.type === 'CREATE') {
        hasCreation = true;
        if (change.node) {
          createdNodes.push(change.node);
        }
      }
    }
    
    if (hasCreation) {
      // Handle the newly created nodes
      // Wait a short time to let Figma finish processing the import
      setTimeout(function() {
        // First try to use the nodes directly from the event
        if (createdNodes.length > 0) {
          for (var i = 0; i < createdNodes.length; i++) {
            handleNodeCreation({ node: createdNodes[i] });
          }
        } 
        // Fall back to using selection
        else if (figma.currentPage.selection.length > 0) {
          for (var i = 0; i < figma.currentPage.selection.length; i++) {
            handleNodeCreation({ node: figma.currentPage.selection[i] });
          }
        }
      }, 1000); // Increased timeout to ensure assets are fully loaded
    }
  });
  
  // Detect asset drops and imports via selection changes
  figma.on('selectionchange', function() {
    // Check the selection for image nodes
    if (figma.currentPage.selection.length > 0) {
      setTimeout(function() {
        // Add slight delay to ensure selection is stable
        var selection = figma.currentPage.selection;
        
        // Skip if selection is empty - could have changed during the timeout
        if (selection.length === 0) return;
        
        // Process each selected node individually
        for (var i = 0; i < selection.length; i++) {
          var node = selection[i];
          
          // Special case for imported images and assets
          var isImage = node.type === 'RECTANGLE' || node.type === 'ELLIPSE' || 
                     node.type === 'FRAME' || node.type === 'IMAGE';
                     
          if (isImage) {
            handleNodeCreation({ node: node });
          }
        }
      }, 500);
    }
  });
}

// Function removed - replaced with direct initialization code

// Run a command
async function runCommand(command) {
  await loadSettings();
  
  if (command === 'addNamesToSelected') {
    // Get selected nodes and filter to only include imported images
    var selection = figma.currentPage.selection;
    console.log("Selection count: " + selection.length);
    
    if (selection.length === 0) {
      figma.notify('Please select at least one frame or image.');
      figma.closePlugin();
      return;
    }
    
    // Find all imported images, including those nested inside frames or groups
    var importedImages = findAssets(selection);
    
    // Remove duplicates (in case an image appears multiple times in the hierarchy)
    var uniqueImages = [];
    var seenIds = {};
    
    for (var i = 0; i < importedImages.length; i++) {
      var image = importedImages[i];
      if (!seenIds[image.id]) {
        seenIds[image.id] = true;
        uniqueImages.push(image);
      }
    }
    
    importedImages = uniqueImages;
    
    console.log("Found " + importedImages.length + " unique imported images");
    
    if (importedImages.length === 0) {
      figma.notify('No imported images found in selection. Please select frames containing images.');
      figma.closePlugin();
      return;
    }
    
    // Process each imported image
    try {
      for (var i = 0; i < importedImages.length; i++) {
        var image = importedImages[i];
        console.log("Processing image: " + image.name);
        await createLabel(image);
      }
      
      if (importedImages.length === 1) {
        figma.notify('Added name label to 1 image');
      } else {
        figma.notify('Added name labels to ' + importedImages.length + ' images');
      }
    } catch (err) {
      console.error("Error processing selection:", err);
      figma.notify('Error: ' + err.message);
    }
    
    figma.closePlugin();
  }
  
  else if (command === 'addNamesToAll') {
    var allNodes = figma.currentPage.children;
    console.log("Page has " + allNodes.length + " top-level nodes");
    
    if (allNodes.length === 0) {
      figma.notify('No content found on this page.');
      figma.closePlugin();
      return;
    }
    
    // Find all imported images on the page, including those nested in frames
    var importedImages = findAssets(allNodes);
    
    // Remove duplicates (in case an image appears multiple times in the hierarchy)
    var uniqueImages = [];
    var seenIds = {};
    
    for (var i = 0; i < importedImages.length; i++) {
      var image = importedImages[i];
      if (!seenIds[image.id]) {
        seenIds[image.id] = true;
        uniqueImages.push(image);
      }
    }
    
    importedImages = uniqueImages;
    
    console.log("Found " + importedImages.length + " unique imported images");
    
    if (importedImages.length === 0) {
      figma.notify('No imported images found on this page.');
      figma.closePlugin();
      return;
    }
    
    // Process each imported image
    try {
      for (var i = 0; i < importedImages.length; i++) {
        var image = importedImages[i];
        console.log("Processing image: " + image.name);
        await createLabel(image);
      }
      
      if (importedImages.length === 1) {
        figma.notify('Added name label to 1 image');
      } else {
        figma.notify('Added name labels to ' + importedImages.length + ' images');
      }
    } catch (err) {
      console.error("Error processing images:", err);
      figma.notify('Error: ' + err.message);
    }
    
    figma.closePlugin();
  }
}

// Handle messages from the UI
figma.ui.onmessage = async function(msg) {
  if (msg.type === 'saveSettings') {
    await saveSettings(msg.settings);
    
    // Restart the plugin to apply new settings
    if (msg.settings.autoLabel !== settings.autoLabel) {
      if (msg.settings.autoLabel) {
        setupAutoLabelingListeners();
        figma.notify('Auto-labeling enabled');
      } else {
        figma.notify('Auto-labeling disabled');
      }
    }
    
    figma.notify('Settings saved!');
  }
  
  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
  
  if (msg.type === 'runCommand') {
    await runCommand(msg.command);
  }
};

// Initialize the plugin with direct command handling
if (figma.command) {
  runCommand(figma.command);
} else {
  // Default behavior - show the UI
  figma.showUI(__html__, { width: 300, height: 450 });
  figma.notify("Select assets and use 'Add Names to Selected Assets' to add labels");
}