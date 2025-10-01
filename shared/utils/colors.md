# Calendar Type Colors

This document provides a reference for all the colors used in the Calendar of Activities and Actions application. These colors are defined in `type-colors.ts` and are used to visually distinguish different types of calendar entries in the UI (activity cards and accordion headers).

## Color Reference Table

| Type Key | Color Preview | Hex Code | Description |
|----------|---------------|----------|-------------|
| cop | ![#009b48](https://via.placeholder.com/50x30/009b48/009b48.png) | `#009b48` | Conference of the Parties (CBD Green) |
| sbstta | ![#009b48](https://via.placeholder.com/50x30/009b48/009b48.png) | `#009b48` | Subsidiary Body on Scientific, Technical and Technological Advice (CBD Green) |
| sbi | ![#009b48](https://via.placeholder.com/50x30/009b48/009b48.png) | `#009b48` | Subsidiary Body on Implementation (CBD Green) |
| meeting | ![#00558C](https://via.placeholder.com/50x30/00558C/00558C.png) | `#00558C` | General meetings and conferences |
| notification | ![#0F7ABD](https://via.placeholder.com/50x30/0F7ABD/0F7ABD.png) | `#0F7ABD` | Notifications |
| nominations | ![#6F1A6B](https://via.placeholder.com/50x30/6F1A6B/6F1A6B.png) | `#6F1A6B` | Calls for nominations |
| submission | ![#1F5C3A](https://via.placeholder.com/50x30/1F5C3A/1F5C3A.png) | `#1F5C3A` | Submission of information |
| peerReview | ![#8C3A13](https://via.placeholder.com/50x30/8C3A13/8C3A13.png) | `#8C3A13` | Peer review processes |
| report | ![#2C3E50](https://via.placeholder.com/50x30/2C3E50/2C3E50.png) | `#2C3E50` | Reports and documentation |
| forum | ![#5C2E2E](https://via.placeholder.com/50x30/5C2E2E/5C2E2E.png) | `#5C2E2E` | Forums and discussions |
| activity | ![#5B2C83](https://via.placeholder.com/50x30/5B2C83/5B2C83.png) | `#5B2C83` | General activities and actions |
| webinar | ![#006F63](https://via.placeholder.com/50x30/006F63/006F63.png) | `#006F63` | Webinars and online sessions |
| workshop | ![#A04B0B](https://via.placeholder.com/50x30/A04B0B/A04B0B.png) | `#A04B0B` | Workshops and training sessions |
| training | ![#3F4C72](https://via.placeholder.com/50x30/3F4C72/3F4C72.png) | `#3F4C72` | Capacity building and training |
| consultation | ![#7C2E4D](https://via.placeholder.com/50x30/7C2E4D/7C2E4D.png) | `#7C2E4D` | Consultations and dialogues |
| campaign | ![#345920](https://via.placeholder.com/50x30/345920/345920.png) | `#345920` | Awareness campaigns and outreach |
| other | ![#4D4D4D](https://via.placeholder.com/50x30/4D4D4D/4D4D4D.png) | `#4D4D4D` | Default/fallback color for unmapped types |

## Usage

These colors are applied to calendar entry headers in the UI through the `getTypeColor()` function in `type-colors.ts`. The function:

1. Normalizes the input type string to one of the keys above
2. Returns both a background color and text color (white `#ffffff` for all types)
3. Is used in components like `calendar-accordion-item.vue` and `calendar-activity-card.vue`

## Special Notes

- **CBD Green** (`#009b48`): This color is reserved for official CBD meetings (COP, SBSTTA, SBI) and is defined as a constant `CBD_GREEN` in the codebase.
- **Text Color**: All type colors use white (`#ffffff`) as the text color for optimal contrast and readability.
- **Pattern Matching**: The system uses regex patterns to automatically classify activities into these types based on keywords in their titles or descriptions.
