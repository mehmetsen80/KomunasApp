# USCIS Monitoring Roadmap

This document tracks planned and potential USCIS resources for real-time monitoring and AI analysis within the Komunas Intelligence platform.

## 🚀 Active Monitoring
- [x] **Forms Library**: Version tracking, URL shifts, and instruction updates.
- [x] **Newsroom Announcements**: "Alerts" tracking with AI summarization.
- [x] **Newsroom Releases**: Official news releases and media alerts.
- [x] **Policy Manual Updates**: Substantive legal shifts and procedural updates.
- [x] **Visa Bulletin Analysis**: Monitor monthly "Adjustment of Status Filing Charts" to alert users on "Dates for Filing" vs "Final Action Dates."

## 🛠️ Platform Stability & UX
- [x] **Session Integrity**: Hardened logout flow with total storage purge and 401 interceptors.
- [x] **Identity Sync**: Resolved database-level identity mismatches and stale cache issues.
- [x] **History Reliability**: Refactored version history tracking to use robust SyncState linking.
- [x] **Timezone Awareness**: Localized date formatting with timezone indicators and UTC array parsing.
- [x] **UI Polish**: Increased logo visibility and user profile real estate for better readability.
- [x] **Deterministic Hashing**: Implemented ID-based sorting and date-priority scraping to prevent redundant updates from CMS order shifts.
- [x] **Notification Stability**: Hardened workflows with substantive change Jumps to protect users from maintenance noise and non-legal PDF updates.

## 🚧 Next Up
- [x] **Processing Times**: Track 80th percentile shifts across specific field offices and form types.

## 🗓️ Future Backlog

### Logistics & Compliance
- [ ] **Fee Schedule (G-1055)**: Real-time detection of fee increases or changes in payment methods.
- [ ] **Filing Locations**: Monitor direct filing address changes to prevent form rejections.
- [ ] **Field Office Status**: Emergency closures and reopening schedules.

### Seasonal & Outreach
- [ ] **H-1B Cap Registration**: Seasonal tracking of lottery windows, technical fixes, and selection rounds.
- [ ] **Engagement Events**: Tracking of upcoming webinars, stakeholder meetings, and outreach engagements.

### Advanced Intelligence
- [ ] **Federal Register**: Monitor unpublished or preview documents for upcoming USCIS regulatory changes.
- [ ] **FOIA Reading Room**: Tracking new policy guidance or data releases in the electronic reading room.
