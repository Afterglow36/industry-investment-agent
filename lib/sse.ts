export function splitSseBlocks(buffer: string) {
  const parts = buffer.split(/\r?\n\r?\n/);
  return { blocks: parts.slice(0, -1), rest: parts.at(-1) || "" };
}

export function getSseData(block: string) {
  const lines = block
    .split(/\r?\n/)
    .filter(line => line.startsWith("data:"))
    .map(line => line.slice(5).trimStart());
  return lines.length ? lines.join("\n") : null;
}
