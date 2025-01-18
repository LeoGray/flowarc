class I18n {
  constructor() {
    this.language = localStorage.getItem('language') || 'zh';
    this.translations = {};
    this.init();
  }

  async init() {
    await this.loadTranslations();
    this.applyTranslations();
    this.setupLanguageSwitcher();
  }

  async loadTranslations() {
    try {
      const url = `lang/${this.language}.json`;
      console.log('Loading translations from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.translations = await response.json();
      console.log('Translations loaded successfully:', this.translations);
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  applyTranslations() {
    document.documentElement.lang = this.language;
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.dataset.i18n;
      const value = this.getTranslation(key);
      
      if (value) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.placeholder = value;
        } else if (element.tagName === 'LI') {
          // Handle list items with array indices
          const match = key.match(/^(.*)\.items\[(\d+)\]$/);
          if (match) {
            const [_, parentKey, index] = match;
            const items = this.getTranslation(`${parentKey}.items`);
            if (Array.isArray(items) && items[index]) {
              element.textContent = items[index];
            }
          }
        } else {
          element.textContent = value;
        }
      } else {
        console.warn(`Missing translation for key: ${key}`);
      }
    });
  }

  getTranslation(key) {
    // Handle array indices in keys like 'parent.items[0]'
    const parts = key.split('.');
    let result = this.translations;
    
    for (const part of parts) {
      const arrayMatch = part.match(/(\w+)\[(\d+)\]/);
      if (arrayMatch) {
        const [_, prop, index] = arrayMatch;
        if (result[prop] && Array.isArray(result[prop])) {
          result = result[prop][index];
        } else {
          return null;
        }
      } else {
        result = result?.[part];
      }
      
      if (result === undefined) {
        return null;
      }
    }
    
    return result;
  }

  async changeLanguage(lang) {
    this.language = lang;
    localStorage.setItem('language', lang);
    await this.loadTranslations();
    this.applyTranslations();
  }

  setupLanguageSwitcher() {
    const switcher = document.createElement('div');
    switcher.className = 'language-switcher';
    
    // Create select element
    const select = document.createElement('select');
    
    // Add language options
    const languages = {
      en: 'English',
      zh: '简体中文',
      'zh-Hant': '繁體中文',
      ja: '日本語',
      ko: '한국어',
      fr: 'Français'
    };
    
    for (const [code, name] of Object.entries(languages)) {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = name;
      if (code === this.language) {
        option.selected = true;
      }
      select.appendChild(option);
    }
    
    // Add event listener
    select.addEventListener('change', (e) => {
      this.changeLanguage(e.target.value);
    });
    
    switcher.appendChild(select);
    document.body.insertBefore(switcher, document.body.firstChild);
  }
}

// Initialize i18n
document.addEventListener('DOMContentLoaded', () => new I18n());