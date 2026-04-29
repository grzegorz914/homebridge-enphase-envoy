# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Homebridge platform plugin integrating Enphase Envoy / IQ Gateway photovoltaic systems with HomeKit. Supports firmware v5–v8, multiple inverter/battery/meter types, and exposes real-time solar production/consumption metrics as HomeKit accessories.

## Commands

There is no build step — the plugin uses native ES modules and is published as-is.

```bash
npm install          # install dependencies
npm test             # (no tests configured)
```

To test locally in Homebridge, install with `npm install -g .` and restart Homebridge.

## Architecture

**Entry point**: [index.js](index.js) — registers the `EnvoyPlatform` class with the Homebridge API.

**Data flow**:
1. `EnvoyPlatform` (index.js) reads config and calls `setupDevice()` per configured device
2. `EnvoyDevice` ([src/envoydevice.js](src/envoydevice.js)) creates all HomeKit accessories/services and starts polling
3. `EnvoyData` ([src/envoydata.js](src/envoydata.js)) fetches from Envoy HTTP endpoints (`/ivp/*`, `/api/*`) using the appropriate auth method
4. `EnvoyDevice` receives emitted data events and updates HomeKit characteristic values
5. Optionally, `RestFul` and `Mqtt` push the same data to external consumers

**Key modules**:

| File | Role |
|------|------|
| [src/envoydevice.js](src/envoydevice.js) | Core device controller (~417 KB); creates accessories, handles HomeKit interactions, wires up all services |
| [src/envoydata.js](src/envoydata.js) | API communication (~124 KB); all HTTP calls to the Envoy device, data parsing, polling via `node-cron` |
| [src/customcharacteristics.js](src/customcharacteristics.js) | Defines custom HomeKit characteristics for solar-specific metrics (power, energy, frequency, etc.) |
| [src/constants.js](src/constants.js) | API endpoint paths, device type enums, auth constants — single source of truth for magic strings |
| [src/envoytoken.js](src/envoytoken.js) | JWT token generation and refresh for firmware v7+ (Enlighten credentials flow) |
| [src/digestauth.js](src/digestauth.js) | HTTP Digest Authentication for firmware v5/v6 |
| [src/passwdcalc.js](src/passwdcalc.js) | Derives installer password from Envoy serial number |
| [src/restful.js](src/restful.js) | Express v5 REST server exposing device data to external systems |
| [src/mqtt.js](src/mqtt.js) | MQTT client for publishing device data |
| [src/functions.js](src/functions.js) | Shared utilities: file I/O, HTTP helpers, data transforms |
| [src/impulsegenerator.js](src/impulsegenerator.js) | Event-driven periodic scheduler used to trigger data refreshes |

## Module System

All files use native ES modules (`"type": "module"` in package.json). Use `import`/`export`, not `require`/`module.exports`. Node.js ≥20 required.

## Authentication

- **Firmware <v7**: Envoy password (auto-detected from serial) via `passwdcalc.js` + HTTP Digest Auth via `digestauth.js`
- **Firmware v7+**: JWT tokens via `envoytoken.js`; user provides Enlighten credentials or a pre-generated token in config

## Configuration Schema

[config.schema.json](config.schema.json) defines the Homebridge UI form. Data refresh intervals default to: production 10 s, live data 5 s, ensemble 15 s. Each accessory can be displayed as Light Bulb, Fan, Humidity Sensor, or Carbon Monoxide Sensor for HomeKit compatibility.
