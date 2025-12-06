# Privacy Policy for Just3D

**Last Updated:** December 25, 2025
**Effective Date:** December 25, 2025

---

## Chrome Web Store Privacy Disclosure

This developer declares that your data is:

- **Not sold to third parties**, outside of the approved use cases
- **Not used or transferred for purposes that are unrelated to the item's core functionality**
- **Not used or transferred to determine creditworthiness or for lending purposes**

Just3D is committed to the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data/), including the [Limited Use](https://developer.chrome.com/docs/webstore/program-policies/limited-use/) requirements.

---

## Privacy Overview (TL;DR)

✅ **We collect:** Nothing. Zero. Nada.
✅ **We store:** Only your local preferences on your device
✅ **We share:** Nothing - we don't even have servers
✅ **We transmit:** Nothing - all processing is 100% local
✅ **Your 3D models:** Never leave your computer
✅ **Your privacy:** Fully protected by design

**Just3D processes everything locally in your browser. We cannot access your data even if we wanted to.**

---

## Introduction

Just3D ("we", "our", or "the extension") is a privacy-first Chrome extension that operates entirely on your local device. This Privacy Policy explains our data practices in compliance with:

- Chrome Web Store Developer Program Policies
- Chrome Web Store User Data Policy
- Limited Use Policy for Chrome Extensions
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)
- Children's Online Privacy Protection Act (COPPA)

---

## Information Collection & Use

### What We DO Collect

**Local Preferences Only:**

Just3D stores minimal settings locally on your device using Chrome's `chrome.storage.local` API:

- Viewer preferences (lighting type, intensity, background color)
- Measurement unit preferences (meters, centimeters, etc.)
- UI state (last selected tab, panel visibility)
- Creator mode configurations (last used shape, texture settings)

**Important:** This data is:
- ✅ Stored **only** on your local device
- ✅ Never transmitted anywhere
- ✅ Never accessible to us or any third party
- ✅ Only used for the core functionality of the extension
- ✅ Cleared when you uninstall the extension

### What We DO NOT Collect

We **absolutely do not** collect, access, use, store, or transmit:

❌ Your 3D model files or content
❌ Personal information (name, email, address, phone)
❌ Browsing history or web activity
❌ Search history
❌ IP addresses or device identifiers
❌ Location data
❌ Usage analytics or telemetry
❌ Crash reports or error logs
❌ Authentication credentials
❌ Financial information
❌ Biometric data
❌ Health information
❌ User identifiers or tracking data
❌ Cookies for tracking purposes
❌ Any data from Chrome APIs beyond storage

**We don't have servers, databases, or any infrastructure to collect data.**

---

## Chrome Web Store Limited Use Policy Compliance

Just3D fully complies with the [Limited Use Policy](https://developer.chrome.com/docs/webstore/program-policies/limited-use/) for Chrome extensions:

### Our Limited Use Commitments:

1. **Single Purpose**
   - Just3D has one purpose: View, create, and convert 3D models locally
   - All features serve this single purpose
   - No hidden functionality or secondary purposes

2. **No Data Sale**
   - We do not sell any user data
   - We have no business model based on data
   - We don't collect data that could be sold

3. **Purpose Limitation**
   - User data (local preferences) is used ONLY for core functionality
   - Not used for advertising, marketing, or analytics
   - Not used for AI/ML training or profiling
   - Not shared with any third parties

4. **No Creditworthiness Determination**
   - We do not use data to determine creditworthiness
   - We do not use data for lending purposes
   - We have no financial services functionality

5. **Transparency**
   - This privacy policy is public and accessible
   - Open source code available for review
   - No hidden data collection

---

## How We Use Data

### Local Preferences (Stored on Your Device)

Preferences are used to:
- Remember your last viewer settings between sessions
- Restore your workspace configuration
- Maintain your chosen measurement units
- Persist creator mode templates

**Processing Location:** 100% local in your browser
**Transmission:** Never
**Access:** Only you and the extension on your device
**Purpose:** Core functionality only

### Your 3D Models

When you load or create 3D models:
- Models are processed **entirely in your browser** using Three.js
- Models are **never** uploaded to any server
- Models are **never** stored by the extension (except in browser's temporary memory)
- Models are cleared when you close the viewer

**We cannot see, access, or collect your 3D models under any circumstances.**

---

## Data Storage & Security

### Local Storage Details

- **Technology:** Chrome's `chrome.storage.local` API
- **Location:** Your computer's local storage
- **Size:** Typically <100KB of preferences
- **Encryption:** Protected by Chrome's built-in security
- **Access Control:** Only Just3D extension can access its own storage
- **Sync:** Not synchronized across devices (by design)

### Security Measures

- ✅ No network communication - no data to intercept
- ✅ Isolated extension storage - other extensions can't access
- ✅ Chrome sandbox - extension runs in secure environment
- ✅ No external dependencies for data processing
- ✅ Local-only processing eliminates server vulnerabilities
- ✅ No authentication - no credentials to compromise

---

## Third-Party Services & Libraries

### Libraries We Use (All Local)

Just3D includes these open-source libraries, bundled locally:

1. **Three.js** (r152)
   - Purpose: 3D graphics rendering
   - Location: Loaded from `/libs/three.module.min.js`
   - Data Access: None - runs entirely in your browser
   - Privacy: No external requests, no tracking

2. **Three.js Add-ons**
   - OrbitControls, TransformControls (camera/object manipulation)
   - Format Loaders (STL, GLB, GLTF, OBJ, FBX, DAE, PLY)
   - Format Exporters (GLB, GLTF, OBJ, STL, PLY)
   - All loaded locally from `/libs/` directory

### What We DON'T Use

❌ Google Analytics or any analytics service
❌ Advertising networks or trackers
❌ Social media SDKs
❌ A/B testing platforms
❌ Crash reporting services (Sentry, Crashlytics, etc.)
❌ User behavior tracking
❌ CDN-hosted libraries (all bundled locally)
❌ External APIs for processing

**Zero external network requests. Zero data leaving your device.**

---

## Data Sharing & Disclosure

### Who We Share Data With: **NOBODY**

We do not share, sell, rent, or disclose any data to:
- Third parties
- Advertisers
- Data brokers
- Analytics companies
- Government agencies (unless legally required)
- Parent companies or affiliates
- Service providers

**Reason:** We don't collect data that could be shared.

### Approved Use Cases (None Apply)

The Chrome Web Store allows data sale for approved use cases. **None apply to Just3D:**
- We don't facilitate financial transactions
- We don't provide security/fraud prevention services
- We don't comply with legal obligations requiring data transfer
- We have no approved use cases for data transfer

---

## Chrome Permissions Explained

Just3D requests minimal permissions. Here's why:

### Storage Permission (`storage`)

- **Purpose:** Save your viewer preferences locally
- **Data Stored:** UI settings, measurement units, workspace configurations
- **Scope:** Local device only
- **Not Used For:** Tracking, analytics, or data collection
- **Limited Use Compliance:** ✅ Used only for core functionality

### Permissions We DON'T Request

We intentionally do NOT request:
- ❌ `tabs` - No access to your browsing tabs
- ❌ `webRequest` - No network monitoring
- ❌ `cookies` - No cookie access
- ❌ `history` - No browsing history
- ❌ `geolocation` - No location tracking
- ❌ Host permissions - No access to websites
- ❌ `identity` - No authentication
- ❌ `management` - No extension management

**Only `storage` permission - that's it.**

---

## Your Privacy Rights

### Rights You Have

1. **Right to Access**
   - View stored data: Chrome DevTools → Application → Storage → Local Storage

2. **Right to Delete**
   - Clear all data: Uninstall extension or clear browser data

3. **Right to Control**
   - Disable extension anytime from `chrome://extensions/`

4. **Right to Transparency**
   - Review this policy and our open-source code

5. **Right to Object**
   - Don't want local storage? Don't install the extension

### How to Exercise Your Rights

**View Your Stored Data:**
```
1. Right-click on the extension icon
2. Select "Inspect popup"
3. Go to Application tab
4. Storage → Local Storage → chrome-extension://[extension-id]
```

**Delete All Data - Option 1 (Recommended):**
```
1. Go to chrome://extensions/
2. Find "Just3D"
3. Click "Remove"
4. Confirm removal
```

**Delete All Data - Option 2:**
```
1. Go to chrome://extensions/
2. Click "Details" under Just3D
3. Scroll down
4. Click "Clear storage and reset"
```

**Delete All Data - Option 3:**
```
1. Chrome Settings → Privacy and Security
2. Clear browsing data
3. Select "Cookies and other site data"
4. Advanced → Select "All time"
5. Clear data
```

---

## Children's Privacy (COPPA Compliance)

Just3D does not collect personal information from anyone, including children under 13 years of age.

- ✅ Safe for all ages
- ✅ No registration or accounts
- ✅ No data collection from children
- ✅ No targeted advertising
- ✅ COPPA compliant by design

Parents: Just3D is a safe tool for children to explore 3D modeling. No personal information is collected or required.

---

## International Data Transfers & GDPR

### GDPR Compliance

Just3D is fully GDPR compliant because:
- ✅ No personal data is collected (Article 4)
- ✅ No data processing outside user's device
- ✅ No data transfer to third parties
- ✅ No profiling or automated decision-making
- ✅ Data minimization principle followed
- ✅ Privacy by design and default

**Legal Basis:** Not applicable - no personal data processing occurs

### International Users

Since all data stays on your local device:
- ✅ No cross-border data transfers
- ✅ Data stays in your jurisdiction
- ✅ GDPR (EU), CCPA (California), PIPEDA (Canada) compliant
- ✅ No Standard Contractual Clauses needed
- ✅ No data localization issues

---

## California Privacy Rights (CCPA)

Under the California Consumer Privacy Act (CCPA), California residents have specific rights. However:

**Just3D does not:**
- Collect personal information as defined by CCPA
- Sell personal information
- Share personal information for cross-context behavioral advertising
- Process sensitive personal information

**Therefore, CCPA disclosure requirements do not apply.** But if they did, you would have:
- Right to know what data is collected ✅ (Nothing)
- Right to delete ✅ (Uninstall extension)
- Right to opt-out of sale ✅ (No sale occurs)
- Right to non-discrimination ✅ (No accounts, no discrimination)

---

## Data Retention

### How Long We Keep Data: **We Don't Keep Data**

- **Preferences:** Stored locally until you clear browser data or uninstall
- **3D Models:** Never stored - processed in memory only
- **Usage Data:** Never collected
- **Logs:** Not generated

### Automatic Deletion

Data is automatically deleted when:
- You uninstall the extension
- You clear browser data
- You reset the extension
- Chrome browser is uninstalled

**We have no retention schedule because we have no data retention.**

---

## Changes to This Privacy Policy

### How We Update This Policy

We may update this Privacy Policy to:
- Reflect new features
- Comply with new regulations
- Improve clarity

**When we update:**
1. "Last Updated" date changes at the top
2. Version number increments
3. Changes noted in CHANGELOG.md
4. Major changes announced in Chrome Web Store listing

**How you're notified:**
- Updated policy in extension repository
- Chrome Web Store listing updated
- Version notes mention privacy changes

### Your Consent

Continued use after changes = acceptance of new policy. If you disagree with changes, uninstall the extension.

---

## Compliance Certifications

Just3D complies with:

✅ **Chrome Web Store Developer Program Policies**
✅ **Chrome Web Store User Data Policy**
✅ **Limited Use Policy for Chrome Extensions**
✅ **GDPR** (General Data Protection Regulation - EU)
✅ **CCPA** (California Consumer Privacy Act - USA)
✅ **COPPA** (Children's Online Privacy Protection Act - USA)
✅ **PIPEDA** (Personal Information Protection - Canada)
✅ **Privacy Shield Principles** (though not collecting data)

**Certification Method:** Compliance by design - no data collection means automatic compliance.

---

## Open Source & Transparency

### Code Review

Just3D is open source (or can be made open source):
- ✅ Source code available for inspection
- ✅ No obfuscation or hidden functionality
- ✅ Community oversight
- ✅ Transparent data practices

**You can verify our privacy claims by reviewing the code.**

### Third-Party Audit

Anyone can audit our extension:
1. Download from Chrome Web Store
2. Unpack the extension
3. Review the source code
4. Verify no network requests
5. Confirm local-only processing

---

## Contact & Support

If you have questions, concerns, or requests regarding this Privacy Policy:

### Contact Methods

- **GitHub Issues:** [Your GitHub Repository URL]
- **Email:** [Your Support Email Address]
- **Response Time:** Within 48-72 hours

### What to Include in Your Request

- Extension version (from `chrome://extensions/`)
- Chrome version
- Your question or concern
- Steps to reproduce (if reporting an issue)

### Data Subject Requests

For GDPR/CCPA requests:
- Since we don't collect data, most requests are not applicable
- For local preference deletion, follow the steps above
- We'll respond within legally required timeframes

---

## Dispute Resolution

### Issues with This Policy

If you believe we are not following this Privacy Policy:
1. Contact us via GitHub Issues or email
2. We will investigate within 48-72 hours
3. We will respond with findings and corrective action (if needed)

### Legal Disputes

Governed by the laws of [Your Jurisdiction]. Any disputes will be resolved through:
1. Good faith negotiation
2. Mediation (if negotiation fails)
3. Arbitration or courts (as a last resort)

---

## Additional Privacy Information

### Browser Fingerprinting

Just3D does **not** use browser fingerprinting techniques:
- No Canvas fingerprinting
- No WebGL fingerprinting
- No Audio context fingerprinting
- No Font enumeration
- No device fingerprinting

### Do Not Track (DNT)

Just3D respects Do Not Track signals. However:
- We don't track users even without DNT
- DNT preference doesn't change our behavior (we don't track regardless)

### Advertising & Marketing

Just3D does not:
- Display advertisements
- Collect data for marketing
- Use retargeting or remarketing
- Participate in ad networks

---

## Privacy by Design

Just3D was built with privacy as a core principle:

### Design Decisions

1. **Local-First Architecture**
   - All processing happens on your device
   - No server backend to compromise

2. **Minimal Permissions**
   - Only request what's absolutely necessary
   - Storage only - nothing else

3. **No Telemetry**
   - Deliberately excluded analytics
   - No crash reporting services

4. **Open Source**
   - Transparent code for community review
   - No hidden functionality

5. **Data Minimization**
   - Collect only essential preferences
   - Don't store 3D models

---

## Definitions

For clarity, here's what we mean by:

- **Personal Data:** Any information relating to an identified or identifiable person
- **Processing:** Any operation performed on data (collection, storage, use, etc.)
- **Third Party:** Any entity other than you or Just3D
- **Local Storage:** Chrome's storage API storing data on your device only
- **Core Functionality:** Viewing, creating, and converting 3D models

---

## Summary (TL;DR)

### The Absolute Essentials

1. **What we collect:** Local preferences only (settings, UI state)
2. **Where it's stored:** Your device only
3. **Who can access it:** Only you
4. **What we share:** Nothing (we don't even collect data to share)
5. **Your 3D models:** Never leave your computer
6. **Our business model:** Not based on your data
7. **Your privacy:** Guaranteed by design

### One-Sentence Summary

**Just3D processes everything locally in your browser, collects zero personal data, and makes zero network requests - your privacy is protected because we literally cannot access your data.**

---

## Policy History

### Version 1.0.0 (December 25, 2025)
- Initial privacy policy
- Chrome Web Store Limited Use compliance
- GDPR/CCPA/COPPA compliance
- Full transparency commitments

---

## Acknowledgment & Consent

By installing and using Just3D, you acknowledge that:
1. You have read this Privacy Policy
2. You understand our data practices
3. You consent to local storage of preferences
4. You understand all processing is local

**You can withdraw consent at any time by uninstalling the extension.**

---

**This Privacy Policy represents our commitment to your privacy. Your trust is important to us.**

For the latest version of this policy, visit: [Your Privacy Policy URL]

---

**Extension Name:** Just3D - 3D Model Viewer & Converter
**Version:** 1.0.0
**Policy Version:** 1.0
**Last Updated:** December 25, 2025
**Last Reviewed:** December 25, 2025
**Next Review:** December 25, 2026

**Questions? Contact us via GitHub Issues or email.**

---

**Chrome Web Store Compliance Statement:**

This extension complies with all Chrome Web Store policies including:
- Developer Program Policies
- User Data Policy
- Limited Use Policy
- Minimum Functionality
- Deceptive Installation Tactics
- Spam and Placement in the Store

**Privacy Certification:** ✅ No data collection, No data sharing, No data sale
