import path from "node:path";
import url from "node:url";

import ignoreModule from "ignore";
import { isUrl, toPath } from "url-or-path";

import readFile from "../utils/read-file.js";

const createIgnore = ignoreModule.default;
const loadCache = new Map();
const instanceCache = new Map();

/** @type {(filePath: string) => string} */
const slash =
  path.sep === "\\"
    ? (filePath) => filePath.replaceAll("\\", "/")
    : (filePath) => filePath;

/**
 * @param {string | URL} file
 * @param {string | undefined} cwd
 * @returns {string}
 */
function getRelativePath(file, cwd) {
  const filePath = isUrl(file) ? url.fileURLToPath(file) : path.resolve(file);

  return path.relative(
    // If there's an ignore-path set, the filename must be relative to the
    // ignore path, not the current working directory.
    cwd || process.cwd(),
    filePath,
  );
}

/**
 * @param {string | URL | undefined} ignoreFile
 * @param {{shouldCache?: boolean}} options
 * @returns {Promise<string>}
 */
async function loadIgnorePatterns(ignoreFile, options) {
  const { shouldCache = true } = options;
  if (!ignoreFile) {
    return "";
  }

  const ignoreFilePath = path.resolve(toPath(ignoreFile));

  if (!shouldCache || !loadCache.has(ignoreFilePath)) {
    const content = await readFile(ignoreFile);
    loadCache.set(ignoreFilePath, content ?? "");
  }

  return loadCache.get(ignoreFilePath);
}

/**
 * @param {(string | URL)[]} ignoreFiles
 * @param {string[]} ignorePatterns
 * @param {boolean} [withNodeModules]
 * @returns {Promise<{cwd?: string, patterns: string}[]>}
 */
async function resolveIgnorePatterns(
  ignoreFiles,
  ignorePatterns,
  withNodeModules,
) {
  const patterns = [];

  // From cli options or config file
  patterns.push({ patterns: ignorePatterns.join("\n") });

  // From ignore files
  const ignorePatternPromises = ignoreFiles
    .filter(Boolean)
    .map(async (ignoreFile) => ({
      cwd: path.dirname(toPath(ignoreFile)),
      patterns: await loadIgnorePatterns(ignoreFile, { shouldCache: true }),
    }));
  patterns.push(...(await Promise.all(ignorePatternPromises)));

  // Ignore node_modules or not
  if (!withNodeModules) {
    patterns.push({ patterns: "node_modules" });
  }

  return patterns;
}

/**
 * @param {{cwd?: string, patterns: string}} pattern
 * @returns {(file: string | URL) => boolean}
 */
function createSingleIsIgnoredFunction(pattern, options) {
  const { cwd, patterns } = pattern;
  const { shouldCache = true } = options;

  const key = `${cwd || process.cwd()}: ${patterns}`;
  if (!shouldCache || !instanceCache.has(key)) {
    const ignore = createIgnore({ allowRelativePaths: true }).add(patterns);
    instanceCache.set(key, ignore);
  }

  const ignore = instanceCache.get(key);

  return (file) => ignore.ignores(slash(getRelativePath(file, cwd)));
}

/**
 * @param {(string | URL)[]} ignoreFiles
 * @param {string[]} [ignorePatterns]
 * @param {boolean} [withNodeModules]
 * @returns {Promise<(file: string | URL) => boolean>}
 */
async function createIsIgnoredFunction(
  ignoreFiles,
  ignorePatterns,
  withNodeModules,
) {
  const patterns = await resolveIgnorePatterns(
    ignoreFiles,
    ignorePatterns || [],
    withNodeModules,
  );

  const isIgnoredFunctions = patterns.map(createSingleIsIgnoredFunction);

  return (file) => isIgnoredFunctions.some((isIgnored) => isIgnored(file));
}

/**
 * @param {string | URL} file
 * @param {{ignorePath: string[], ignorePatterns?: string[], withNodeModules?: boolean}} options
 * @returns {Promise<boolean>}
 */
async function isIgnored(file, options) {
  const { ignorePath: ignoreFiles, ignorePatterns, withNodeModules } = options;
  const isIgnored = await createIsIgnoredFunction(
    ignoreFiles,
    ignorePatterns,
    withNodeModules,
  );
  return isIgnored(file);
}

export { createIsIgnoredFunction, isIgnored };
