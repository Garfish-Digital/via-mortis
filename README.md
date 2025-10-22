# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/minimal)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/minimal)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/minimal/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).


> My thoughts on the full site destruction:\
  - When a user clicks the "please take me" button on line 261, it activates a 10000ms animation.
  - After the 10000ms animation completes, the site needs to be reloaded.
  - We want several of the elements on @src/pagesindex.astro to "fall" off the page one of 3 ways: fall straight down, hinge right then fall, hinge left then fall.
  - The falls should have "ease-in" easing so that they begin their fall slowly then speed up.
  - We want the distribution of the 3 types of falls to be applied randomly at random times throughout the animation, and the timing of all of the falls should be randomized between 500ms and 8000ms to ensure the falls have completed before the page reloads at 10000ms.
  - The elements from file @src/pages/index.astro we want to be randomly effected are as follows: 
    **- The <div> on lines 14-16
    **- The <DisplacementMap> on lines 18-30
    **- The <GlitchTransition> on lines 59-61
    **- The 6 <Postcard> elements on lines 64-116
    **- The <GlitchTransition> on lines 126-128
    **- The 3 <p> elements on lines 131-150
    **- The "story-image" <div> on lines 154-157
    **- The <GlitchTransition> on lines 165-167
    **- The 3 "event-card" <div> elements on lines 170-222
    **- The <GlitchTransition> on lines 232-234
    **- The "contact-details" <div> on lines 236-250
    **- The "warning-notice" <div> on lines 253-263
- Please ask any clarifying questions to help us achieve the best result.


