# Admission Note Builder - AI Enhanced

An AI-powered admission note builder designed for NTUH (National Taiwan University Hospital) EMR integration.

## Features

- **AI-Powered Parsing**: Paste or dictate clinical notes, and AI (Google Gemini) structures them into admission form fields
- **Voice Recognition**: Supports both Chinese (zh-TW) and English voice input
- **EMR-Compatible Output**: Generates notes formatted for direct copy-paste into NTUH EMR tabs
- **Per-Section Copy Buttons**: Copy individual sections to corresponding EMR tabs
- **Auto-Save**: All data persists in browser localStorage
- **Offline Capable**: Single HTML file, works without server

## Sections

- Chief Complaint & Present Illness
- Patient History (PMH, PSH, Medications, Allergies, Family History, TOCC, Social History)
- Psychosocial Assessment
- Review of Systems (ROS)
- Vitals & Physical Examination
- Imaging Report
- Pathology Report
- Tentative Diagnosis (Active/Underlying)
- Medical Needs and Care Plan (SOAP format)
- Discharge Planning

## Setup

1. Open `Admission_AI_POC.html` in a modern browser (Chrome recommended for voice recognition)
2. Enter your [Google Gemini API key](https://aistudio.google.com/app/apikey) when prompted
3. The API key is stored locally in your browser - never sent anywhere except Google's API

## Usage

1. Paste clinical notes into the AI Quick Entry panel, or use voice input
2. Click "Parse with AI" to auto-populate form fields
3. Review and edit the populated fields as needed
4. Use section copy buttons or "Copy Full Note" to transfer to EMR

## Security Notes

- No backend server - all processing happens client-side
- API keys stored in browser localStorage only
- No patient data is stored or transmitted except to Google Gemini API for parsing
- Clear patient data between patients using Settings > "Clear for New Patient"

## Requirements

- Modern web browser (Chrome, Edge, Firefox, Safari)
- Google Gemini API key (free tier available)
- Internet connection for AI parsing

## License

Private repository - NTUH internal use only.