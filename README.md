# Sharing Button for Salesforce

A Chrome extension that adds a convenient "Sharing" button to Salesforce Lightning and Classic pages, providing quick access to record sharing details without navigating through multiple menus.

The idea originated from: https://chromewebstore.google.com/detail/salesforce-sharing-button/lobdjldobokombkcmnbmhepkllilmmhg, which became unavailable due to security issues on newer versions of Chrome. However, since I didn't have access to the original code, this was recreated from Scratch.

## Available in the Chrome Web Store

https://chromewebstore.google.com/detail/sharing-button-for-salesf/dhkekfkiddkcphagbaokhgngciemmkpi?authuser=0&hl=pt-BR

## ⚠️ Important Warnings

### Independent Development
This Chrome extension is **NOT** developed, endorsed, or affiliated with Salesforce.com, Inc. It is an independent third-party development created by the open-source community. Use at your own discretion.

### Sharing Object Requirements
The sharing functionality requires that the Salesforce object be set to **Private** in your organization's sharing settings. If an object is set to Public Read/Write or Public Read Only, the corresponding `__Share` object will not exist, and the sharing button will not work properly. Unfortunately, we can't validate the definition of when to show this button or not. Any suggestions on how to do that as a new PR are appreciated.

## Features

- **One-Click Access**: Instantly open sharing details for any Salesforce record
- **Smart Integration**: Seamlessly integrates with Salesforce Lightning and Classic UI
- **Automatic Detection**: Automatically detects record IDs from various URL patterns
- **Fallback Support**: Creates a floating button if the global actions menu is unavailable
- **Dynamic Updates**: Handles page navigation and dynamic content changes
- **Dual Interface Support**: Works on both Lightning and Classic Salesforce pages
- **Context-Aware Styling**: Automatically adapts button appearance to match the current interface

![til](https://github.com/renan-brasilio/sf-sharing-button/blob/main/images/button_presentation.gif)

## Installation

### From Source Code

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The extension will be installed and ready to use

## Usage

1. Navigate to any Salesforce Lightning or Classic record detail page
2. Look for the "Sharing" button:
   - **Lightning**: In the global actions menu (top-right area)
   - **Classic**: In the linkElements div (typically near the top of the page)
3. Click the button to open the sharing details in a new tab
4. If the button isn't visible in the expected location, a floating button will appear in the top-right corner

### Supported Page Types

The extension works on various Salesforce pages:

**Lightning Pages:**
- Record detail pages (`/lightning/r/Object/ID/view`)
- Console pages (`/sObject/ID/view`)
- Custom object pages

**Classic Pages:**
- Record detail pages (`my.salesforce.com/ID`)
- Any page with a valid Salesforce record ID in the URL

**Note**: On Classic pages, the button only appears when there's a valid Salesforce record ID in the URL.

## How It Works

### Record ID Detection

The extension automatically extracts record IDs using multiple methods:
- URL pattern matching for Lightning, console, and classic pages
- Data attributes (`data-recordid`) on page elements
- Support for both 15-character and 18-character Salesforce IDs
- Context-aware detection based on page type (Lightning vs Classic)

### Button Integration

**Lightning Pages:**
1. **Primary Method**: Inserts the button into the Lightning global actions menu (`ul.slds-global-actions`)
2. **Fallback Method**: Creates a floating button in the top-right corner if the global actions menu is unavailable

**Classic Pages:**
1. **Primary Method**: Inserts the button into the `div.linkElements` container as the first element
2. **Fallback Method**: Creates a floating button in the top-right corner if the linkElements div is unavailable

**Both Interfaces:**
- **Dynamic Updates**: Uses MutationObserver to re-insert the button when the page content changes
- **Context-Aware Styling**: Automatically applies appropriate styling (Lightning Design System vs Classic Salesforce styling)

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
- **Translations** (`translations.js`): Contains multilingual text strings for the extension interface

### Language Support

The extension supports multiple languages through the browser's `navigator.language` capability. The translation system:

- **Automatic Detection**: Detects the user's browser language automatically
- **Fallback Support**: Falls back to English if the detected language is not supported
- **Google Languages Compatible**: In theory, any language supported by Google Chrome's `navigator.language` is supported here
- **Easy Extension**: New languages can be added by updating the `translations.js` file

#### Current Supported Languages
The extension dynamically loads all available languages from the `translations.js` file. Currently supported languages include:

- **English** (en) - Primary language
- **Portuguese** (pt) - Translated by the developer
- **French** (fr) - Translated by the developer
- **Spanish** (es), **German** (de), **Italian** (it), **Japanese** (ja), **Korean** (ko), **Chinese** (zh), **Russian** (ru), **Arabic** (ar), **Hindi** (hi), **Dutch** (nl), **Swedish** (sv), **Danish** (da), **Finnish** (fi), **Polish** (pl), **Turkish** (tr), **Hebrew** (he)

*Note: The language dropdown in settings is automatically populated from the translations file, so adding new languages to `translations.js` will immediately make them available in the settings.*

#### Translation Credits
I speak only Portuguese, English and a bit of French, the others were created with the help of ChatGPT. While efforts were made to ensure accuracy, there may be translation errors or areas for improvement.

#### Contributing Translations
If you notice any translation errors or would like to add support for a new language:

1. **Report Issues**: Open an issue on GitHub describing the translation problem
2. **Suggest Improvements**: Provide corrected translations in your issue
3. **Add New Languages**: Submit a pull request with new language entries in `translations.js`
4. **Follow Format**: Use the existing structure in `translations.js` for consistency

**Note**: Since the extension uses the browser's language detection, any language supported by Chrome should theoretically work once added to the translations file.

#### Language Settings
Users can configure their language preference through the extension's settings page:

1. **Access Settings**: Right-click the extension icon and select "Options" or go to `chrome://extensions/` and click "Extension options"
2. **Language Mode**: Choose between:
   - **Auto**: Uses your browser's default language (recommended)
   - **Manual**: Select a specific language from the dropdown
3. **Save Changes**: Click "Save Settings" to apply your preferences

The settings are automatically synchronized across all your Chrome instances and will be applied immediately to all active Salesforce tabs.

### URL Patterns Supported

**Lightning Pages:**
- `/lightning/r/Object/ID/view`
- `/lightning/r/ID/view`
- `/sObject/ID/view` (console)
- `/r/Object/ID/view` (console)

**Classic Pages:**
- `/ID` (e.g., `my.salesforce.com/a0p5s000005tyFK`)
- `/ID/` (with trailing slash)

## Permissions

The extension requires the following permissions:
- `activeTab`: To access the current Salesforce page
- `tabs`: To create new tabs for sharing details

## Troubleshooting

### Button Not Appearing
- Ensure you're on a Salesforce Lightning or Classic page with a valid record ID
- For Classic pages, verify the URL contains a valid Salesforce record ID (e.g., `my.salesforce.com/a0p5w000005tyFK`)
- Refresh the page and wait a few seconds for the button to appear
- Check if the floating button appears in the top-right corner

### "Could not detect a Record Id" Error
- Make sure you're on a record detail page
- For Classic pages, ensure the URL follows the pattern `my.salesforce.com/ID` where ID is a valid Salesforce record ID
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
