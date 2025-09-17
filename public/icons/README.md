# Icons Folder

This folder contains logos and icons for the application.

## Debit Note Logo

To add the Handle Inter Freight Logistics logo for Debit Notes:

1. **Drop your logo file here** and rename it to: `handle-logo.png`
2. **Recommended specifications:**
   - Format: PNG (with transparent background)
   - Dimensions: 200x80 pixels or similar ratio
   - File size: Under 100KB for faster loading

## Current Usage

The logo is used in:
- **Debit Note Preview**: `/debit-note/[id]` (height: 64px)
- **Debit Note Print**: `/debit-note/print/[id]` (height: 48px)

## File Path in Code

```tsx
<img 
  src="/icons/handle-logo.png" 
  alt="Handle Inter Freight Logistics" 
  className="h-12 w-auto" // or h-16 w-auto
/>
```

## Note

The logo will automatically scale proportionally based on the height setting while maintaining aspect ratio.

