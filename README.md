# SF Sharing Button Chrome Extension

A Chrome extension that adds a convenient "Sharing" button to Salesforce Lightning pages, providing quick access to record sharing details without navigating through multiple menus.

## Features

- **One-Click Access**: Instantly open sharing details for any Salesforce record
- **Smart Integration**: Seamlessly integrates with Salesforce Lightning UI
- **Automatic Detection**: Automatically detects record IDs from various URL patterns
- **Fallback Support**: Creates a floating button if the global actions menu is unavailable
- **Dynamic Updates**: Handles page navigation and dynamic content changes

## Installation

### From Source Code

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The extension will be installed and ready to use

### Files Included

- `manifest.json` - Extension configuration and permissions
- `background.js` - Background script for handling tab creation
- `content.js` - Content script that injects the sharing button
- `icons/icon128.png` - Extension icon

## Usage

1. Navigate to any Salesforce Lightning record detail page
2. Look for the "Sharing" button in the global actions menu (top-right area)
3. Click the button to open the sharing details in a new tab
4. If the button isn't visible in the global actions, a floating button will appear in the top-right corner

### Supported Page Types

The extension works on various Salesforce Lightning pages:
- Record detail pages (`/lightning/r/Object/ID/view`)
- Console pages (`/sObject/ID/view`)
- Custom object pages
- Any page with a valid Salesforce record ID

## How It Works

### Record ID Detection

The extension automatically extracts record IDs using multiple methods:
- URL pattern matching for Lightning and console pages
- Data attributes (`data-recordid`) on page elements
- Support for both 15-character and 18-character Salesforce IDs

### Button Integration

1. **Primary Method**: Inserts the button into the Lightning global actions menu (`ul.slds-global-actions`)
2. **Fallback Method**: Creates a floating button in the top-right corner if the global actions menu is unavailable
3. **Dynamic Updates**: Uses MutationObserver to re-insert the button when the page content changes

### Communication Flow

1. Content script detects a record ID on the current page
2. User clicks the "Sharing" button
3. Content script sends a message to the background script with the sharing URL
4. Background script opens the sharing URL in a new tab

## Technical Details

### Architecture

- **Content Script** (`content.js`): Runs on Salesforce pages, handles UI injection and record detection
- **Background Script** (`background.js`): Handles tab creation and message communication
- **Manifest** (`manifest.json`): Defines permissions and script injection rules

### Key Functions

- `extractRecordId()`: Extracts record ID from URL patterns and page elements
- `deepQuerySelector()`: Searches through shadow DOM for elements
- `insertInGlobalActionsUl()`: Inserts button into Lightning global actions menu
- `insertFloatingButton()`: Creates floating button as fallback
- `tryInsert()`: Main insertion logic with fallback strategy

### URL Patterns Supported

- `/lightning/r/Object/ID/view`
- `/lightning/r/ID/view`
- `/sObject/ID/view` (console)
- `/r/Object/ID/view` (console)

## Permissions

The extension requires the following permissions:
- `activeTab`: To access the current Salesforce page
- `tabs`: To create new tabs for sharing details

## Troubleshooting

### Button Not Appearing
- Ensure you're on a Salesforce Lightning page with a valid record ID
- Refresh the page and wait a few seconds for the button to appear
- Check if the floating button appears in the top-right corner

### "Could not detect a Record Id" Error
- Make sure you're on a record detail page
- Try navigating to a different record and back
- Check that the URL contains a valid Salesforce record ID

### Button Disappears After Navigation
- The extension automatically re-inserts the button when page content changes
- If issues persist, refresh the page

## Development

### Local Development

1. Make changes to the source code
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes on Salesforce pages

### Debugging

- Use Chrome DevTools to inspect the content script
- Check the Console tab for any error messages
- Use the Elements tab to verify button insertion

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on Salesforce Lightning pages
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.
