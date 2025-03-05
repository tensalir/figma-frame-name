<<<<<<< HEAD
# figma-frame-name
Figma plugin that automatically adds the name of an imported image below it.
=======
# Asset Name Plugin for Figma

A powerful Figma plugin that automatically adds the filename of imported assets underneath them, making it easier to match designs with the corresponding files in your source folders.

## Overview

Designers often import multiple assets into Figma from their local file system. Over time, it can become difficult to remember which design element corresponds to which file. This plugin solves that problem by automatically labeling each imported asset with its original filename.

![Asset Name Plugin Demo](banner-placeholder.png)

## Features

- **Deep Frame Search**: Automatically finds all imported images at any nesting level
- **Smart Text Placement**: Places labels directly underneath each asset with proper centering
- **Adaptive Text Styling**: 
  - Font size scales proportionally with asset dimensions
  - Text color adapts to background (light text on dark backgrounds, dark text on light backgrounds)
- **Selective Labeling**: Label just selected assets or all assets on the page
- **Customizable Settings**: Control appearance and behavior through the settings panel

## How It Works

### Functional Flow

1. **Asset Detection**:
   - The plugin scans for imported images (both direct IMAGE nodes and shapes with image fills)
   - Recursively searches through nested frames, groups, and components
   - Identifies assets by checking for image types and image fills

2. **Smart Labeling**:
   - Creates text labels with the asset's filename (minus the extension)
   - Positions labels directly underneath each asset
   - Centers text perfectly relative to the asset width

3. **Visual Adaptation**:
   - Calculates font size proportionally to asset dimensions
     - Small assets get smaller text
     - Large assets get larger text (up to 400px for very large assets)
   - Detects background darkness using luminance calculation
     - Uses light text (#FBF9F8) on dark backgrounds
     - Uses dark text (#252427) on light backgrounds

### Tech Stack

- **Figma Plugin API**: Core platform for accessing Figma's document structure
- **JavaScript**: All plugin logic is written in vanilla JavaScript for maximum compatibility
- **HTML/CSS**: Simple UI for settings panel
- **Custom Algorithms**:
  - Recursive deep search for nested assets
  - Proportional font size calculation
  - Background luminance detection for adaptive text color

## Installation

1. Download the plugin files from this repository
2. In Figma, go to **Plugins > Development > Import plugin from manifest**
3. Select the `manifest.json` file from this repository
4. The plugin will be available in your development plugins menu

## Usage

### Labeling Single Assets

1. Select one or more imported assets
2. Run the plugin from the Plugins menu
3. Choose "Add Names to Selected Assets"
4. Text labels will appear below each asset

### Labeling Assets in Frames

1. Select a frame or group containing imported assets
2. Run the plugin
3. Choose "Add Names to Selected Assets"
4. All imported assets inside the selected frame(s) will be labeled

### Labeling All Assets

1. Run the plugin
2. Choose "Add Names to All Assets"
3. All imported assets on the current page will be labeled

### Customizing Settings

1. Run the plugin
2. Choose "Settings"
3. Adjust parameters as needed
4. Click "Save Settings"

## Roadmap

### Short-term Improvements

- **Auto-Detection on Import**: Automatically label assets when they're first imported
- **Enhanced UI**: More intuitive settings panel with live preview
- **Text Styling Options**: Font family selection, weight options, and additional color schemes
- **Position Options**: Allow labels to be placed above, left, or right of assets

### Medium-term Features

- **Template Support**: Save and apply different labeling templates for different projects
- **Batch Renaming**: Rename multiple assets with patterns or numbering schemes
- **Layer Organization**: Automatically organize labeled assets into groups or sections
- **Export Mapping**: Generate a mapping document showing asset names and their positions

### Long-term Vision

- **Asset Management Integration**: Connect with DAM (Digital Asset Management) systems
- **Version Tracking**: Track and display version information from linked files
- **Team Collaboration**: Share asset organization schemes across team members
- **Smart Suggestions**: ML-based suggestions for organizing and naming assets

## Development

### Project Structure

- `manifest.json`: Plugin configuration and metadata
- `code.js`: Core plugin logic for asset detection and labeling
- `ui.html`: Settings interface

### Development Workflow

1. Clone this repository
2. Make changes to the files as needed
3. Test by importing the plugin into Figma
4. Submit pull requests for new features or improvements

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request with new features, improvements, or bug fixes.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Figma for their comprehensive Plugin API
- The design community for inspiring this tool
- All contributors and testers who helped improve the plugin
>>>>>>> 5ecb618 (Version 1 of the Frame Name Figma Plugin)
