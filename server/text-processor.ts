// IMPORTANT: DO NOT PROCESS TEXT AT ALL
// Our previous version was injecting spaces inside words!
// Examples: "b a sic" instead of "basic", "st a rt" instead of "start"
// We now simply return the original text without any processing

export function cleanText(text: string): string {
  // Return the original text without any modifications
  // This ensures spacing remains exactly as provided by the model
  return text || "";
}