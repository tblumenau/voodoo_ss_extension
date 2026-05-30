# Contributing

Thanks for contributing to Voodoo ShipStation Extension.

This project is small, but it has a few moving parts:

- A Chrome Manifest V3 build in `manifest.json`
- A Firefox-oriented Manifest V2 variant in `manifest.json.v2`
- A content script that injects ShipStation UI hooks and collects order data
- A background script that handles network calls, login flow, and persistent logging
- Options and modal pages for browser-side configuration and login

## Development Overview

The extension runs in three main layers:

1. `js/content_script.js` runs inside ShipStation pages, reads the DOM, injects controls, and sends extension messages.
2. `js/background.js` receives those messages, calls the configured Voodoo endpoint, manages login retries, and stores log entries.
3. `html/options.html` with `js/options.js`, plus `html/modal.html` with `js/login.js`, provide the user-facing configuration and login flows.

In practice, most feature changes touch both the ShipStation-facing content script and the background request flow.

## Repository Layout

### Root files

- `manifest.json`: Primary Chrome and Chromium manifest using Manifest V3 and a service worker background script.
- `manifest.json.v2`: Firefox-oriented manifest variant for temporary local loading.
- `buildCommand`: The current one-line zip packaging command.
- `VoodooForShipStation.zip`: Generated source archive used for manual installation.
- `LICENSE`: MIT license for the project.
- `README.md`: User-facing overview and installation instructions.

### JavaScript

- `js/content_script.js`: Core ShipStation integration. This file reads the current page, identifies orders, SKUs, quantities, and batch contexts, injects UI affordances, and sends messages to the extension runtime.
- `js/background.js`: Network and orchestration layer. It receives `voodooCall` and `voodooDevices` messages, builds requests, performs login fallback, and keeps an activity log in `chrome.storage.local`.
- `js/options.js`: Saves and restores extension settings from `chrome.storage.local`, renders version info from the manifest, and displays the background activity log.
- `js/login.js`: Runs inside the popup login window, shows the configured endpoint, resizes the modal, and sends credentials back to the background script.

### HTML

- `html/options.html`: Main options UI for endpoint, identity, display, and behavior settings.
- `html/modal.html`: Login popup shown when the background script needs fresh credentials.

### CSS

- `css/options.css`: Styling for the options page.
- `css/modal.css`: Styling for the login modal.

### Assets

- `icons/`: Extension icons used by the manifest and UI pages.

## How The Pieces Work Together

Typical request flow:

1. A user interacts with ShipStation, or auto-submit logic detects a relevant scan.
2. `js/content_script.js` extracts ShipStation data such as order number, SKU, quantity, and optional extra display text.
3. The content script sends a runtime message to `js/background.js`.
4. The background script reads saved settings from `chrome.storage.local` and sends the request to the configured Voodoo endpoint.
5. If the API key is missing or no longer valid, the background script opens `html/modal.html` so the user can log in again.
6. The background script stores log entries, and the options page reads and displays those entries.

## Browser Compatibility Notes

- Chrome and Chromium browsers use `manifest.json`.
- Firefox local loading uses `manifest.json.v2`, renamed to `manifest.json` in a Firefox-specific copy of the extracted folder.
- If you change permissions, background behavior, or web-accessible resources, review both manifests.

## ShipStation DOM Caveats

Most breakages happen because ShipStation changes its DOM structure or class names.

- Be cautious when changing selectors in `js/content_script.js`.
- Test the screens and flows you touched in live ShipStation pages.
- Expect scan-page behavior to evolve over time. Recent verified cases include `div[data-pair-*]` rows for scan headers and `verified-quantity-count-*` on item-count elements.

## Local Testing

### Chrome or Chromium

1. Extract or use the repository folder directly.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select the repository folder.
6. Reload the extension after each code change.

### Firefox

1. Make a copy of the folder.
2. Rename `manifest.json` to `manifest.chrome.json`.
3. Rename `manifest.json.v2` to `manifest.json`.
4. Open `about:debugging#/runtime/this-firefox`.
5. Load the copied folder's `manifest.json` as a temporary add-on.

## Packaging

To rebuild the zip archive:

```sh
zip -r VoodooForShipStation.zip . -x "*.git*" "*.gitignore" "buildCommand"
```

That command intentionally excludes Git metadata and the packaging helper file itself.

## Release Checklist

Use this checklist before publishing or handing off a new build:

1. Update the version in `manifest.json` and `manifest.json.v2`.
2. Review manifest permissions, background configuration, icons, and web-accessible resources in both manifests.
3. Test the Chrome build locally by loading the repository folder with `manifest.json` in a Chromium-based browser.
4. Test the Firefox build locally by swapping in `manifest.json.v2` as `manifest.json` in a separate copy of the folder and loading it through `about:debugging`.
5. Rebuild `VoodooForShipStation.zip` with the packaging command above.
6. Inspect the zip contents to confirm it includes the extension files and excludes Git metadata.
7. If you are publishing Chrome, upload the Chrome package to the existing Chrome Web Store listing.
8. If you are publishing Firefox, create and submit a signed `.xpi` through Mozilla's add-on process.
9. Update `README.md` and any release notes if installation steps, browser support, or required configuration changed.

## Contribution Guidelines

- Keep pull requests focused on one behavior change or one documentation improvement.
- Avoid broad refactors in `js/content_script.js` unless you have verified the affected ShipStation workflows.
- When changing request payloads or login behavior, test the full content-script to background-script to endpoint path.
- Update `README.md` if installation or browser support changes.
- Update both manifests when a browser-facing capability changes.