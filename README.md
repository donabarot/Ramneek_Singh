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

## Custom domain later

After buying a domain, configure it in GitHub Pages settings and add the required DNS records at your domain provider. The static site itself does not need any code changes for the domain switch.
