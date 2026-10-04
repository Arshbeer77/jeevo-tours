# Immersive navigation integration

The production website is static HTML, CSS and JavaScript. Its menu is implemented
in `assets/jeevo-navigation.js` and `assets/jeevo-navigation.css`, linked from the
homepage and every tour page. It adapts the supplied reference's full-screen wipe,
staggered links, character hover animation and travel image layout. A native modal
dialog handles background isolation, with keyboard focus cycling, Escape dismissal,
scroll locking, focus restoration and reduced-motion support.

The original React component is preserved in `components/ui/immersive-full-screen-nav.tsx`.
Its demo is `components/immersive-nav-demo.tsx`. These are reference files and are not
loaded by the static site; no React, Tailwind, shadcn or GSAP dependency is required
to run the current website.

## Using the React reference in a React project

1. Start a React project with TypeScript (for example, the Vite `react-ts` template).
2. Initialize shadcn with `npx shadcn@latest init` in that React project and complete
   its Tailwind setup. Configure the `@/*` import alias to the project's source root.
3. Install the component dependency with `npm install gsap`.
4. Copy the component into that source root's `components/ui` directory. Keep this
   folder consistent with the shadcn aliases so `@/components/ui/...` resolves.
5. Import the component in the React entry page and provide Jeevo's links, images,
   white header, indigo overlay and orange accent configuration.

The React reference would require its own integration checks before a framework
migration. The tested menu used by this website is the static adaptation above.
