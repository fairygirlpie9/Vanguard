# Vanguard Preparedness Hub

Vanguard is a survival intelligence system designed to bridge the gap between complex environmental data and human-centric action. It uses Gemini 3 Pro for tactical reasoning and Datadog for resilient hardware observability on a Raspberry Pi 2.

## Project Architecture
* **Intelligence Layer:** Google AI Studio (Gemini 3 Pro) for survival strategy and manifest management.
* **Hardware Layer:** Raspberry Pi 2 (ARMv7) running the Datadog IoT Agent.
* **Command Center:** Datadog Dashboards and Incident Management.

## Deployment Instructions

### 1. Hardware Monitoring (Raspberry Pi 2)
1. Install the Datadog IoT Agent (v7) on your Pi.
2. Place `vanguard-monitor.py` on the device.
3. Start the monitor:
   ```bash
   python3 vanguard-monitor.py

Traffic Generator (For Reviewers)
To simulate the system telemetry without the physical hardware:

Install requirements: pip install datadog

Run the generator:

Bash

python3 traffic_generator.py

AI Studio Setup
Access the Vanguard Survival Interface via the Google AI Studio link provided below:

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/16M5xW3ZXcvqQQdhjQvJ4w-DI4jUDvUPM

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
