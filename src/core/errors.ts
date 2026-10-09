/** A problem that the person can fix. Its message is written for them; a frontend shows it as is. */
export class ImAiError extends Error {
  override name = "ImAiError";
}

/** Something already exists where im-ai wants to create it. A frontend can offer to overwrite it. */
export class ExistsError extends ImAiError {
  override name = "ExistsError";
}
