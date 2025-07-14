# JS-Distributor

This is the core engine of the `js-distributor` tool, packaged separately as an NPM module for reuse and modularity. Below is a breakdown of its structure and main components.

## Folder Structure

```
distributor/
├── bin/
├── src/
│ ├── antlr4/
│ ├── config/
│ ├── helpers/
│ ├── templates/
│ ├── transformations/
│ ├── visitors/
│ └── main.js
├── package.json
└── README.md
```

### `bin/` – Binaries and scripts

This folder contains the binary for [ANTLR](https://www.antlr.org/) the parser generator used by JS-Distributor. If the grammar needs to change, you need to run it. It requires Java.

### `src/` – Source code

- **antlr4/** – Contains the ANTLR-generated or custom parsers for JavaScript code
- **config/** – Code for loading the configuration file
- **helpers/** – Different utility classes used by the tool
- **templates/** – Code generation templates
- **transformations/** – AST transformations
- **visitors/** - Visitors for traversing the code
- **main.js** - Entrypoint for the tool

### `package.json`

Defines module metadata, dependencies (e.g. `antlr4`, AST libraries), build/test scripts, and entry points (`main`, `bin`, etc.).

### `README.md`

Explains usage of the `distributor` module, installation steps, API, and examples.

---

## How to release new version via NPM


To publish a new version of the js-distributor module to the NPM registry:

1. Make sure you're logged in to NPM

```bash
npm login
```
> This will prompt for your NPM username, password, and 2FA (if enabled).

2. Update the version number

Update the version in package.json using semantic versioning:

```bash
npm version patch   # for small fixes
npm version minor   # for new features, backward-compatible
npm version major   # for breaking changes
```
> This will:
> * Update the version in package.json
> * Create a Git commit with a tag (e.g., v1.2.0)

3. Push the changes to GitHub

```bash
git push origin main --follow-tags
```
> The --follow-tags flag ensures the Git tag (e.g., v1.2.0) is pushed too.

4. Publish the package to NPM

```bash
npm publish
```
> Make sure you're inside the distributor/ folder

5. Done!

Your new version will be live at https://www.npmjs.com/package/js-distributor