export const packageJsonTemplate = (serverInfo) => `
{
    "name": "${serverInfo.id}",
    "version": "1.0.0",
    "description": "",
    "main": "index.js",
    "devDependencies": {},
    "scripts": {
      "test": "echo 'Error: no test specified' && exit 1"
    },
    "keywords": [],
    "author": "",
    "license": "ISC",
    "type": "module"
  }
`;