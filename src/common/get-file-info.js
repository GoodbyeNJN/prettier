import { resolveConfig } from "../config/resolve-config.js";
import { isIgnored } from "../utils/ignore.js";
import inferParser from "../utils/infer-parser.js";

/**
 * @typedef {{ ignorePath?: string | URL | (string | URL)[], ignorePatterns?: string[], withNodeModules?: boolean, plugins: object, resolveConfig?: boolean }} FileInfoOptions
 * @typedef {{ ignored: boolean, inferredParser: string | null }} FileInfoResult
 */

/**
 * @param {string | URL} file
 * @param {FileInfoOptions} options
 * @returns {Promise<FileInfoResult>}
 *
 * Please note that prettier.getFileInfo() expects options.plugins to be an array of paths,
 * not an object. A transformation from this array to an object is automatically done
 * internally by the method wrapper. See withPlugins() in index.js.
 */
async function getFileInfo(file, options) {
  if (typeof file !== "string" && !(file instanceof URL)) {
    throw new TypeError(
      `expect \`file\` to be a string or URL, got \`${typeof file}\``,
    );
  }

  let { ignorePath, ignorePatterns, withNodeModules } = options;
  // In API we allow single `ignorePath`
  if (!Array.isArray(ignorePath)) {
    ignorePath = [ignorePath];
  }

  if (!Array.isArray(ignorePatterns)) {
    ignorePatterns = [];
  }
  if (ignorePatterns.length === 0 && options.resolveConfig !== false) {
    const config = await resolveConfig(file);
    if (Array.isArray(config?.ignorePatterns)) {
      ignorePatterns.push(...config.ignorePatterns);
    }
  }

  const ignored = await isIgnored(file, {
    ignorePath,
    ignorePatterns,
    withNodeModules,
  });

  let inferredParser;
  if (!ignored) {
    inferredParser = await getParser(file, options);
  }

  return {
    ignored,
    inferredParser: inferredParser ?? null,
  };
}

async function getParser(file, options) {
  let config;
  if (options.resolveConfig !== false) {
    config = await resolveConfig(file);
  }

  return config?.parser ?? inferParser(options, { physicalFile: file });
}

export default getFileInfo;
