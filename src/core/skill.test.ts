import { describe, expect, it } from "vitest";
import { checkSkill } from "./skill.ts";

function skillMd(frontmatter: string, body = "# Body\n"): string {
  return `---\n${frontmatter}\n---\n\n${body}`;
}

describe("checkSkill", () => {
  it("accepts a valid skill and returns its description", () => {
    const result = checkSkill(
      "commit-messages",
      skillMd("name: commit-messages\ndescription: Write commit messages."),
    );

    expect(result).toEqual({ description: "Write commit messages.", problems: [] });
  });

  it("rejects a name that does not match the folder name", () => {
    const result = checkSkill("commit-messages", skillMd("name: commits\ndescription: Write commit messages."));

    expect(result.problems).toEqual(['name "commits" does not match the folder name "commit-messages"']);
  });

  it("rejects a skill without a name", () => {
    const result = checkSkill("commit-messages", skillMd("description: Write commit messages."));

    expect(result.problems).toEqual(["name is missing"]);
  });

  it.each([
    ["uppercase letters", "Commit-Messages"],
    ["an underscore", "commit_messages"],
    ["a leading hyphen", "-commit-messages"],
    ["a trailing hyphen", "commit-messages-"],
    ["a double hyphen", "commit--messages"],
    ["more than 64 characters", "a".repeat(65)],
  ])("rejects a name with %s", (_, name) => {
    const result = checkSkill(name, skillMd(`name: ${name}\ndescription: Write commit messages.`));

    expect(result.problems).toEqual([
      `name "${name}" must be 1-64 characters of a-z, 0-9 and hyphens, without leading, trailing or double hyphens`,
    ]);
  });

  it("accepts a name of exactly 64 characters", () => {
    const name = "a".repeat(64);

    expect(checkSkill(name, skillMd(`name: ${name}\ndescription: Long name.`)).problems).toEqual([]);
  });

  it.each([
    ["no description", "name: commit-messages"],
    ["an empty description", 'name: commit-messages\ndescription: ""'],
  ])("rejects a skill with %s", (_, frontmatter) => {
    const result = checkSkill("commit-messages", skillMd(frontmatter));

    expect(result).toEqual({ description: undefined, problems: ["description is missing"] });
  });

  it("rejects a description longer than 1024 characters", () => {
    const description = "x".repeat(1025);

    const result = checkSkill("commit-messages", skillMd(`name: commit-messages\ndescription: ${description}`));

    expect(result).toEqual({ description, problems: ["description is longer than 1024 characters (1025)"] });
  });

  it("rejects a SKILL.md without frontmatter", () => {
    const result = checkSkill("commit-messages", "# Commit messages\n");

    expect(result).toEqual({ description: undefined, problems: ["SKILL.md has no frontmatter"] });
  });

  it("rejects frontmatter that is not valid YAML", () => {
    const result = checkSkill("commit-messages", skillMd("name: commit-messages\ndescription: [unclosed"));

    expect(result.description).toBeUndefined();
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]).toMatch(/^frontmatter is not valid YAML: /);
  });

  it("rejects frontmatter that is not a mapping", () => {
    const result = checkSkill("commit-messages", skillMd("- commit-messages"));

    expect(result).toEqual({ description: undefined, problems: ["frontmatter is not a YAML mapping"] });
  });

  it("rejects a description that is not text", () => {
    const result = checkSkill("commit-messages", skillMd("name: commit-messages\ndescription: 123"));

    expect(result).toEqual({ description: undefined, problems: ["description must be text"] });
  });

  it("counts the description length in characters, not in UTF-16 units", () => {
    const description = "🙂".repeat(1024);

    const result = checkSkill("commit-messages", skillMd(`name: commit-messages\ndescription: ${description}`));

    expect(result).toEqual({ description, problems: [] });
  });
});
