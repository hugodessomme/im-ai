import { parse } from "yaml";

const namePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const maxNameLength = 64;
const maxDescriptionLength = 1024;

export type SkillCheck = {
  description: string | undefined;
  /** Why the skill is invalid. Empty when the skill is valid. */
  problems: string[];
};

/** Checks a skill against the Agent Skills spec, from its folder name and its SKILL.md content. */
export function checkSkill(folderName: string, skillMd: string): SkillCheck {
  const frontmatter = readFrontmatter(skillMd);
  if (typeof frontmatter === "string") {
    return { description: undefined, problems: [frontmatter] };
  }
  const problems: string[] = [];

  const name = frontmatter.name;
  if (name === undefined) {
    problems.push("name is missing");
  } else if (typeof name !== "string" || name.length > maxNameLength || !namePattern.test(name)) {
    problems.push(
      `name "${String(name)}" must be 1-${maxNameLength} characters of a-z, 0-9 and hyphens, without leading, trailing or double hyphens`,
    );
  } else if (name !== folderName) {
    problems.push(`name "${name}" does not match the folder name "${folderName}"`);
  }

  const description =
    typeof frontmatter.description === "string" && frontmatter.description !== "" ? frontmatter.description : undefined;
  if (description === undefined) {
    problems.push("description is missing");
  } else if (description.length > maxDescriptionLength) {
    problems.push(`description is longer than ${maxDescriptionLength} characters (${description.length})`);
  }

  return { description, problems };
}

/** Returns the frontmatter as a mapping, or the problem that prevents reading it. */
function readFrontmatter(skillMd: string): Record<string, unknown> | string {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/.exec(skillMd);
  if (match === null) {
    return "SKILL.md has no frontmatter";
  }

  let value: unknown;
  try {
    value = parse(match[1] ?? "");
  } catch (error) {
    const firstLine = (error as Error).message.split("\n")[0];
    return `frontmatter is not valid YAML: ${firstLine}`;
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return "frontmatter is not a YAML mapping";
  }
  return value as Record<string, unknown>;
}
