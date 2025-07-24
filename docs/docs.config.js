const config = {
  projectName: 'Fjell Express Router',
  basePath: '/express-router/',
  port: 3004,
  branding: {
    theme: 'express-router',
    tagline: 'Express Router for Fjell',
    backgroundImage: '/pano.png',
    github: 'https://github.com/getfjell/express-router',
    npm: 'https://www.npmjs.com/package/@fjell/express-router'
  },
  sections: [
    {
      id: 'overview',
      title: 'Getting Started',
      subtitle: 'Express Router for Fjell',
      file: '/README.md'
    },
    {
      id: 'examples',
      title: 'Examples',
      subtitle: 'Code examples & usage patterns',
      file: '/examples-README.md'
    }
  ],
  plugins: [],
  version: {
    source: 'package.json'
  }
};
export default config;
