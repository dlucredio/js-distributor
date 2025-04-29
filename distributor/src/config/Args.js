let instance = null;
class VarArgs {
  constructor(
    mode,
    configFile,
    inputDirRelative,
    outputDirRelative,
    cleanOutput,
    generateProjects,
    generateDocker,
    rootDir
  ) {
    this.mode = mode;
    this.configFile = configFile;
    this.inputDirRelative = inputDirRelative;
    this.outputDirRelative = outputDirRelative;
    this.cleanOutput = cleanOutput;
    this.generateProjects = generateProjects;
    this.generateDocker = generateDocker;
    this.rootDir = rootDir;
  }
}

function init(
  mode,
  configFile,
  inputDirRelative,
  outputDirRelative,
  cleanOutput,
  generateProjects,
  generateDocker,
  rootDir
) {
  if (instance) {
    throw new ConfigError("Configuration already initialized.");
  }
  instance = new VarArgs(
    mode,
    configFile,
    inputDirRelative,
    outputDirRelative,
    cleanOutput,
    generateProjects,
    generateDocker,
    rootDir
  );
}

function getInstance() {
  if (!instance) {
    throw new ConfigError("Configuration not initialized.");
  }
  return instance;
}

function getMode() {
  return getInstance().mode;
}

function getConfigFile() {
  return getInstance().configFile;
}

function getInputDirRelative() {
  return getInstance().inputDirRelative;
}

function getOutputDirRelative() {
  return getInstance().outputDirRelative;
}

function getCleanOutput() {
  return getInstance().cleanOutput;
}

function getGenerateProjects() {
  return getInstance().generateProjects;
}

function getGenerateDocker() {
  return getInstance().generateDocker;
}

function getRootDir() {
  return getInstance().rootDir;
}

export default {
  init,
  getMode,
  getConfigFile,
  getInputDirRelative,
  getOutputDirRelative,
  getCleanOutput,
  getGenerateProjects,
  getGenerateDocker,
  getRootDir,
};
