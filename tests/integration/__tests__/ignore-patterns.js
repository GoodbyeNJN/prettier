describe("ignore patterns from cli arguments should work", () => {
  runCli("cli/ignore-patterns/cli-arguments", [
    ".",
    "--ignore-pattern=*.ignored.js",
    "-l",
  ]).test({
    status: 1,
    stderr: "",
    write: [],
  });
});

describe("ignore patterns from config options should work", () => {
  runCli("cli/ignore-patterns/config-options", [".", "-l"]).test({
    status: 1,
    stderr: "",
    write: [],
  });
});

describe("ignore patterns from cli arguments should overrides config options", () => {
  runCli("cli/ignore-patterns/cli-overrides-config", [
    ".",
    "-l",
    "--ignore-pattern=*.ignored.js",
  ]).test({
    status: 1,
    stderr: "",
    write: [],
  });
});

describe("ignore patterns from cli or config should merge with .prettierignore and .gitignore", () => {
  runCli("cli/ignore-patterns/merge-dot-ignore", [".", "-l"]).test({
    status: 1,
    stderr: "",
    write: [],
  });
  runCli("cli/ignore-patterns/merge-dot-ignore", [
    ".",
    "-l",
    "--ignore-pattern=cli.ignored.js",
  ]).test({
    status: 1,
    stderr: "",
    write: [],
  });
  runCli("cli/ignore-patterns/merge-dot-ignore", [
    ".",
    "-l",
    "--ignore-path=gitignore",
  ]).test({
    status: 1,
    stderr: "",
    write: [],
  });
  runCli("cli/ignore-patterns/merge-dot-ignore", [
    ".",
    "-l",
    "--ignore-path=gitignore",
    "--ignore-pattern=cli.ignored.js",
  ]).test({
    status: 1,
    stderr: "",
    write: [],
  });
});

describe("ignore patterns from config in sub-directories should not be applied", () => {
  runCli("cli/ignore-patterns/sub-directories", [".", "-l"]).test({
    status: 1,
    stderr: "",
    write: [],
  });
  runCli("cli/ignore-patterns/sub-directories", ["sub", "-l"]).test({
    status: 1,
    stderr: "",
    write: [],
  });
  runCli("cli/ignore-patterns/sub-directories", ["sub/file.js", "-l"]).test({
    status: 1,
    stderr: "",
    write: [],
  });
});

describe("overrides option in config should not have ignorePatterns", () => {
  runCli("cli/ignore-patterns/config-options-overrides", [".", "-l"]).test({
    status: 1,
    stderr: "",
    write: [],
  });
});
