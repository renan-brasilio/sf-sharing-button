/**
 * @description Options page script for the SF Sharing Button Chrome extension.
 * Handles language settings configuration and storage.
 */
document.addEventListener('DOMContentLoaded', function() {
    const languageModeSelect = document.getElementById('languageMode');
    const languageSelect = document.getElementById('languageSelect');
    const languageSelectLabel = document.getElementById('languageSelectLabel');
    const saveBtn = document.getElementById('saveBtn');
    const statusDiv = document.getElementById('status');
    const browserLanguageSpan = document.getElementById('browserLanguage');

    // Show current browser language
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    browserLanguageSpan.textContent = browserLang;

    // Apply translations to page elements
    applyTranslations();

    // Populate language dropdown from translations
    populateLanguageDropdown();

    // Load saved settings
    loadSettings();

    // Event listeners
    languageModeSelect.addEventListener('change', function() {
        if (this.value === 'manual') {
            languageSelect.style.display = 'block';
            languageSelectLabel.style.display = 'block';
        } else {
            languageSelect.style.display = 'none';
            languageSelectLabel.style.display = 'none';
        }
    });

        saveBtn.addEventListener('click', saveSettings);

    /**
     * @description Apply translations to page elements based on user's language preference
     */
    function applyTranslations() {
        // Get user's preferred language
        chrome.storage.sync.get({
            languageMode: 'auto',
            selectedLanguage: 'en'
        }, function(items) {
            let langCode;

            if (items.languageMode === 'manual') {
                langCode = items.selectedLanguage;
            } else {
                // Auto mode - use browser language
                const browserLang = navigator.language || navigator.userLanguage || 'en';
                langCode = browserLang.split('-')[0].toLowerCase();
            }

            // Get translations for the language
            const translations = window.sfSharingTranslations || {};
            const langTranslations = translations[langCode] || translations['en'] || {};

            // Apply translations to page elements
            const elements = {
                'settingsSubtitle': langTranslations.settingsSubtitle,
                'languageSettingsTitle': langTranslations.languageSettingsTitle,
                'languageSettingsDescription': langTranslations.languageSettingsDescription,
                'languageModeLabel': langTranslations.languageModeLabel,
                'languageModeAuto': langTranslations.languageModeAuto,
                'languageModeManual': langTranslations.languageModeManual,
                'languageSelectLabel': langTranslations.languageSelectLabel,
                'browserLanguageText': langTranslations.browserLanguageText,
                'saveBtn': langTranslations.saveButtonText
            };

            // Update each element
            Object.keys(elements).forEach(id => {
                const element = document.getElementById(id);
                if (element && elements[id]) {
                    if (id === 'saveBtn') {
                        element.textContent = elements[id];
                    } else {
                        element.textContent = elements[id];
                    }
                }
            });
        });
    }

    /**
     * @description Populate the language dropdown with available languages from translations
     */
    function populateLanguageDropdown() {
        // Clear existing options
        languageSelect.innerHTML = '';

        // Add languages from translations
        if (window.sfSharingTranslations) {
            Object.keys(window.sfSharingTranslations).forEach(langCode => {
                const option = document.createElement('option');
                option.value = langCode;
                // Use langEnglishName from translations, fallback to language code if not available
                const langName = window.sfSharingTranslations[langCode].langEnglishName || `${langCode} (${langCode.toUpperCase()})`;
                option.textContent = langName;
                languageSelect.appendChild(option);
            });
        } else {
            // Fallback if translations are not loaded
            const fallbackLanguages = [
                { code: 'en', name: 'English' },
                { code: 'pt', name: 'Português (Portuguese)' },
                { code: 'fr', name: 'Français (French)' }
            ];

            fallbackLanguages.forEach(lang => {
                const option = document.createElement('option');
                option.value = lang.code;
                option.textContent = lang.name;
                languageSelect.appendChild(option);
            });
        }
    }

    /**
     * @description Load saved settings from Chrome storage
     */
    function loadSettings() {
        chrome.storage.sync.get({
            languageMode: 'auto',
            selectedLanguage: 'en'
        }, function(items) {
            languageModeSelect.value = items.languageMode;
            languageSelect.value = items.selectedLanguage;

            // Show/hide language select based on mode
            if (items.languageMode === 'manual') {
                languageSelect.style.display = 'block';
                languageSelectLabel.style.display = 'block';
            }
        });
    }

    /**
     * @description Save settings to Chrome storage
     */
    function saveSettings() {
        const settings = {
            languageMode: languageModeSelect.value,
            selectedLanguage: languageSelect.value
        };

        chrome.storage.sync.set(settings, function() {
            // Get translated success message
            const translations = window.sfSharingTranslations || {};
            const langCode = settings.languageMode === 'manual' ? settings.selectedLanguage :
                           (navigator.language || navigator.userLanguage || 'en').split('-')[0].toLowerCase();
            const langTranslations = translations[langCode] || translations['en'] || {};
            const successMessage = langTranslations.saveSuccessMessage || 'Settings saved successfully!';

            showStatus(successMessage, 'success');

            // Update status in all active tabs
            chrome.tabs.query({}, function(tabs) {
                tabs.forEach(function(tab) {
                    chrome.tabs.sendMessage(tab.id, {
                        type: 'settingsUpdated',
                        settings: settings
                    }).catch(function() {
                        // Ignore errors for tabs that don't have our content script
                    });
                });
            });
        });
    }

    /**
     * @description Show status message
     * @param {string} message - The message to display
     * @param {string} type - The type of status (success/error)
     */
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';

        // Hide status after 3 seconds
        setTimeout(function() {
            statusDiv.style.display = 'none';
        }, 3000);
    }
});
