# Play Console - Post-Rebrand Checklist
Complete these steps in order after building and uploading your new AAB.

---

## PART 1 - Before You Build

1. Confirm strings.xml shows: <string name="app_name">ReadyToFly</string>
2. Confirm app.json has name/displayName = ReadyToFly, slug = readytofly
3. Confirm package.json has name = readytofly
4. Bump versionCode in android/app/build.gradle (current + 1)
5. Bump versionName to 1.3.0 (optional but recommended)
6. Build the signed AAB:

   cd android && ./gradlew bundleRelease

   Output: android/app/build/outputs/bundle/release/app-release.aab

---

## PART 2 - Host the Privacy Policy

7. Upload privacy-policy.html to a public URL:
   - GitHub Pages: push to gh-pages branch
   - Or deploy at: https://readytofly.in/privacy-policy
8. Verify URL loads in Incognito (no login required)

---

## PART 3 - Play Console: Store Listing

9.  Play Console > Store Presence > Main Store Listing
10. App name: ReadyToFly - Pre-Flight Companion
    NOTE: This is 34 chars vs the 30-char limit. If Play rejects it use: ReadyToFly Pre-Flight
11. Short description: Your smart pre-flight companion for stress-free travel.
12. Full description: paste the full block from store-listing.md
13. App icon: upload 512x512 PNG (replace FlyEasy icon)
14. Feature graphic: upload 1024x500 PNG (required)
15. Screenshots: upload at least 2 phone screenshots, replace FlyEasy-branded ones
16. Click Save

---

## PART 4 - Play Console: App Content

17. Go to: App Content > Privacy Policy
18. Paste your hosted privacy policy URL from step 8
19. Click Save
20. Go to: App Content > Ads - set Contains ads = Yes (free users see AdMob ads)

---

## PART 5 - Upload New Release

21. Production (or target track) > Create new release
22. Upload app-release.aab from step 6
23. Release notes (en-US):
    Rebranded to ReadyToFly. Performance improvements and new features.
24. Click Save, then Review release
25. Resolve any policy warnings shown before submitting
26. Click Start rollout to Production

---

## PART 6 - Policy Rejection Resolution

27. Open Policy Status (link in the rejection email)
28. Confirm each flagged issue is resolved:
    - App name mismatch: fixed by steps 1-3 and 10
    - Missing or invalid privacy policy: fixed by steps 7-8 and 17-19
    - Metadata/description issues: fixed by steps 10-12
    - Icon or screenshot issues: fixed by steps 13-15
29. Submit the new release - Play re-reviews within 1-3 business days

---

## PART 7 - After Approval

30. Search ReadyToFly on Play Store to confirm the listing is live
31. Update https://readytofly.in with new branding
32. Announce rebrand on social channels (handles in src/constants/brand.ts)

---

## Quick Reference

| Field              | Value                                               |
|--------------------|-----------------------------------------------------|
| App title          | ReadyToFly - Pre-Flight Companion                   |
| Package ID         | com.flyeasy - DO NOT change (breaks existing users) |
| Developer          | Myth96                                              |
| Contact email      | hello.readytofly@gmail.com                          |
| Privacy policy URL | https://readytofly.in/privacy-policy                |
| Website            | https://readytofly.in                               |
