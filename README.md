# Ramneek Singh Website

This is a static portfolio website built with plain HTML, CSS, and JavaScript.

## Local preview

From the project root, run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## GitHub Pages deployment

This repository includes a GitHub Actions workflow for static deployment to GitHub Pages.

1. Push this project to a GitHub repository.
2. Go to the repository Settings.
3. Open Pages.
4. Choose GitHub Actions as the source if prompted.
5. The workflow in `.github/workflows/deploy-pages.yml` will publish the site automatically on pushes to `main`.

## Managing concerts (Google Forms + Sheets)

Concerts are published from a Google Sheet, so the client can add events without editing this site. Upcoming events appear on the home page and the Upcoming Concerts page. Once an event date is before today, the event automatically moves into Past concerts. To correct or remove an event, edit or delete its response row in the linked Sheet.

One-time setup:

1. Create a Google Form owned by the site owner and add these questions with these exact titles:
   - `Concert date` (Date question; required)
   - `Location` (Short answer; required)
   - `Description` (Paragraph; optional)
   - `Ticket URL` (Short answer; optional, include the full `https://` address)
2. In the Form's Responses tab, create or select its response spreadsheet. Give the client permission to submit the Form. Give them Sheet editor access only if they should also correct or delete existing entries.
3. In the response spreadsheet, choose **File → Share → Publish to web**, select the responses worksheet, choose **Comma-separated values (.csv)**, and publish it. Copy the published CSV URL.
4. Put the URL between the quotes in `window.CONCERTS_CSV_URL` in `js/concerts-config.js`, then publish the site. Keep the spreadsheet publicly viewable only via the published CSV; do not put private information in it.
5. Test a future-dated response and a past-dated response. The form can be shared directly with the client as their event-entry interface.

The published Sheet is read-only from the website. Form submissions update its rows; deleting a row removes an event from both pages. If the CSV URL is blank, the pages show their no-upcoming-events message. If the Sheet is temporarily unreachable, the site displays an availability message.

## Custom domain later

After buying a domain, configure it in GitHub Pages settings and add the required DNS records at your domain provider. The static site itself does not need any code changes for the domain switch.
