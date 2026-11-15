// Copies the competition image to the configured output directory.
// Entry for make.fun's ai-excited-01 competition.
import { access, copyFile, mkdir, stat } from 'node:fs/promises';
import { constants } from 'node:fs';

const source = new URL('./entry.png', import.meta.url);
const outputDirectory = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

try {
  await access(source, constants.R_OK);
  const sourceStats = await stat(source);
  if (!sourceStats.isFile() || sourceStats.size === 0) {
    throw new Error('source entry.png is missing or empty');
  }
  await mkdir(outputDirectory, { recursive: true });
  const destination = `${outputDirectory}/entry.png`;
  await copyFile(source, destination);
  const written = await stat(destination);
  console.log(`Wrote ${written.size} bytes to ${destination}`);
} catch (error) {
  console.error(`Failed to copy entry.png: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
