# Voodoo ShipStation Extension

Voodoo ShipStation Extension is an open-source browser extension that adds Voodoo device actions directly inside ShipStation. It injects controls into ShipStation pages so warehouse teams can light devices, show order data on device screens, and trigger related actions without leaving the ShipStation workflow.

This repository is published under the MIT License. Contributions are welcome.

## What it does

- Adds extension behavior to `shipstation.com` pages through a content script.
- Sends requests to a configurable Voodoo Devices endpoint.
- Lets operators configure device text, color, timeout, beep, auto-submit, and display fields.
- Includes an options page for browser-side configuration and activity logs.

## Open Source

This project is open source under the MIT License. That means you can use it, modify it, and share it with minimal restrictions.

If you want to contribute:

- Open an issue for bugs, browser compatibility problems, or feature requests.
- Send a pull request for fixes, cleanup, or documentation improvements.
- Keep changes focused and include enough detail for someone else to test them in ShipStation.

For a code and file layout overview, see `CONTRIBUTING.md`.

## Install From The Zip File

The repository already includes `VoodooForShipStation.zip`, but it is a source archive, not a browser-store package. In both Chrome and Firefox, start by extracting the zip to a normal folder on disk.

### Chrome, Chromium, Edge, or Brave

If you do not want to load the extension manually, you can install the published Chrome build from the Google Chrome Web Store: [Voodoo ShipStation Extension](https://chromewebstore.google.com/detail/voodoo-shipstation-extens/pdondkkpjhibbopapgkadlloddigeffk).

1. Extract `VoodooForShipStation.zip`.
2. Open `chrome://extensions` in Chrome, or the equivalent extensions page in another Chromium-based browser.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted folder that contains `manifest.json`.
6. After it loads, open the extension's **Options** page and configure the endpoint and device settings you need.

Important: Chrome does not install this repository's `.zip` file directly. It must be extracted first and loaded as an unpacked extension.

### Firefox

This repository includes a separate Firefox-compatible manifest file named `manifest.json.v2`. Use that file when loading the extension in Firefox.

1. Extract `VoodooForShipStation.zip`.
2. Make a copy of the extracted folder for Firefox so you do not disturb the Chrome version.
3. Inside the Firefox copy, rename `manifest.json` to `manifest.chrome.json`.
4. Rename `manifest.json.v2` to `manifest.json`.
5. Open `about:debugging#/runtime/this-firefox` in Firefox.
6. Click **Load Temporary Add-on**.
7. Select the `manifest.json` file from the Firefox copy of the extracted folder.
8. Open the extension's options page and configure the endpoint and other settings.

Important: Firefox also does not install this repository's plain `.zip` file directly. The local developer path is to extract it and load the manifest. A temporary add-on is removed when Firefox restarts. For a persistent Firefox install, package and sign it as an `.xpi` through Mozilla's add-on process.

## Packaging A New Zip

If you need to regenerate the distributable archive from the repository contents, the current build command is:

```sh
zip -r VoodooForShipStation.zip . -x "*.git*" "*.gitignore" "buildCommand"
```

## Configuration Notes

After installation, the options page lets you configure:

- Endpoint URL
- Device name and instruction text
- Light color and timeout
- Minimal mode, beep, and auto-submit
- Which order or shipment fields appear on device screens

## License

See the `LICENSE` file for the full MIT license text.