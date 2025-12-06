/**
 * Just3D Internationalization (i18n) Module
 * Handles automatic translation of UI elements using Chrome's i18n API
 */

/**
 * Initialize i18n for all elements with data-i18n attributes
 * This function finds all elements marked for translation and replaces their text
 * with the appropriate translation from messages.json
 */
function initI18n() {
  console.log('Initializing i18n...');

  // Get current locale for debugging
  const currentLocale = chrome.i18n.getUILanguage();
  console.log('Current locale:', currentLocale);

  // Translate all elements with data-i18n attribute (text content)
  const elementsToTranslate = document.querySelectorAll('[data-i18n]');
  console.log(`Found ${elementsToTranslate.length} elements to translate`);

  elementsToTranslate.forEach(element => {
    const key = element.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(key);

    if (message) {
      // Handle different element types
      if (element.tagName === 'INPUT') {
        if (element.type === 'button' || element.type === 'submit') {
          element.value = message;
        } else if (element.hasAttribute('placeholder')) {
          element.placeholder = message;
        }
      } else if (element.tagName === 'TEXTAREA' && element.hasAttribute('placeholder')) {
        element.placeholder = message;
      } else {
        // For all other elements, set text content
        element.textContent = message;
      }
    } else {
      console.warn(`Translation not found for key: ${key}`);
    }
  });

  // Translate all elements with data-i18n-title attribute (tooltips)
  const elementsWithTooltips = document.querySelectorAll('[data-i18n-title]');
  console.log(`Found ${elementsWithTooltips.length} tooltips to translate`);

  elementsWithTooltips.forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    const message = chrome.i18n.getMessage(key);

    if (message) {
      element.title = message;
    } else {
      console.warn(`Tooltip translation not found for key: ${key}`);
    }
  });

  // Translate all elements with data-i18n-placeholder attribute
  const elementsWithPlaceholders = document.querySelectorAll('[data-i18n-placeholder]');
  console.log(`Found ${elementsWithPlaceholders.length} placeholders to translate`);

  elementsWithPlaceholders.forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const message = chrome.i18n.getMessage(key);

    if (message) {
      element.placeholder = message;
    } else {
      console.warn(`Placeholder translation not found for key: ${key}`);
    }
  });

  // Translate all elements with data-i18n-aria-label attribute (accessibility)
  const elementsWithAriaLabels = document.querySelectorAll('[data-i18n-aria-label]');
  console.log(`Found ${elementsWithAriaLabels.length} aria-labels to translate`);

  elementsWithAriaLabels.forEach(element => {
    const key = element.getAttribute('data-i18n-aria-label');
    const message = chrome.i18n.getMessage(key);

    if (message) {
      element.setAttribute('aria-label', message);
    } else {
      console.warn(`Aria-label translation not found for key: ${key}`);
    }
  });

  console.log('i18n initialization complete');
}

/**
 * Get a translated message with optional substitutions
 * @param {string} key - The message key from messages.json
 * @param {string|string[]} substitutions - Optional substitution values
 * @returns {string} The translated message
 */
function getMessage(key, substitutions = null) {
  return chrome.i18n.getMessage(key, substitutions);
}

/**
 * Get the current UI language
 * @returns {string} Language code (e.g., 'en', 'de', 'es')
 */
function getUILanguage() {
  return chrome.i18n.getUILanguage();
}

/**
 * Dynamically translate an element
 * Useful for dynamically created elements
 * @param {HTMLElement} element - The element to translate
 * @param {string} key - The message key
 * @param {string} attribute - Optional attribute to set (default: textContent)
 */
function translateElement(element, key, attribute = 'textContent') {
  const message = chrome.i18n.getMessage(key);

  if (message) {
    if (attribute === 'textContent') {
      element.textContent = message;
    } else if (attribute === 'placeholder') {
      element.placeholder = message;
    } else if (attribute === 'title') {
      element.title = message;
    } else if (attribute === 'aria-label') {
      element.setAttribute('aria-label', message);
    } else {
      element.setAttribute(attribute, message);
    }
  } else {
    console.warn(`Translation not found for key: ${key}`);
  }
}

/**
 * Update document title if it has data-i18n
 */
function updateDocumentTitle() {
  const titleElement = document.querySelector('title[data-i18n]');
  if (titleElement) {
    const key = titleElement.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(key);
    if (message) {
      document.title = message;
    }
  }
}

// Run i18n initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initI18n();
    updateDocumentTitle();
  });
} else {
  // DOM already loaded
  initI18n();
  updateDocumentTitle();
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
  window.i18n = {
    init: initI18n,
    getMessage: getMessage,
    getUILanguage: getUILanguage,
    translateElement: translateElement
  };
}
