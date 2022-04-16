export function validateTag(tag: string): boolean {
  return /^[a-zA-Z0-9]*$/.test(tag);
}

export function validateName(name: string): boolean {
  return /(^$|^[a-zA-Z]+( [a-zA-Z]+)?$)/.test(name);
}