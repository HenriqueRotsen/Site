# HenriqueRotsen — Personal Site

Table of contents
- [About](#about)
- [Demo](#demo)
- [Features](#features)
- [Built with](#built-with)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## About
This repository contains the source for my personal website. It is primarily built with JavaScript, CSS, and HTML. Use this repo to view, develop, and deploy the site.

## Demo
Live site: https://henriquerotsen.github.io/Site

## Features
- Responsive layout for desktop and mobile
- Clean, minimal design for a personal portfolio and blog
- Project showcase and external links to repositories
- Contact information / contact form (if applicable)
- Easy to extend with additional pages and components

## Built with
- JavaScript (frontend logic)
- CSS (styling)
- HTML (markup)
- React

## Getting started

### Prerequisites
- Node.js (>= 20) and npm or yarn, if the project uses a build tool or dev server.
- If the site is static, a web browser is sufficient to open index.html.

### Clone the repository
```
git clone https://github.com/HenriqueRotsen/Site.git
cd Site
```
### Install dependencies (if applicable)
```npm install```
**or**
```yarn```

### Run the development server (if the project has one)
```npm start```
**or**
```yarn start```

Then open http://localhost:3000 (or the address shown by your dev server).

### Build for production (example)
```npm run build```
**or**
```yarn build```

The output will be in the configured build directory (e.g., dist/ or build/).

## Available scripts
These are common script names — please replace with the actual scripts from package.json if different:
- ```npm start``` — start local development server
-``` npm run build``` — create a production build
- ```npm test``` — run tests
- ```npm run lint``` — run linters

If this is a static site without a package.json
- Open index.html in a browser or host with a static server:
npx serve .
(Replace with your preferred static server.)

## Deployment
Common hosting options:
- GitHub Pages — push the build or static files to gh-pages branch (or use Actions).
- **Área restrita (faturas):** ver [BILLING_API.md](./BILLING_API.md) — Worker `billing-api-henrique` na Cloudflare.
- Vercel — connect the repository and configure build settings.
- Netlify — connect the repository and configure build/deploy settings.
- Any static hosting provider that serves the output directory.

## Contributing
Contributions are welcome. Suggested workflow:
1. Fork the repository.
2. Create a branch: git checkout -b feature/my-feature
3. Make your changes and commit them.
4. Push to your fork and open a pull request.

Please include:
- A clear description of your change
- Screenshots if UI changes are involved
- Any testing steps

## License
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
This project is licensed under the MIT License — see the LICENSE file for details.

## Contact
Henrique Rotsen — comercial.henriquerotsen@gmail.com
Project link: https://github.com/HenriqueRotsen/Site
