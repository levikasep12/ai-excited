// Copies entry.png to the configured output directory and reports its byte count.
// Parses the copied JPEG's SOF marker and reports its dimensions.
import { access, copyFile, mkdir, readFile, stat } from 'node:fs/promises';
import { constants } from 'node:fs';

const source = new URL('./entry.png', import.meta.url);
const outputDirectory = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function readJpegDimensions(data: Buffer): { width: number; height: number } {
  if (data[0] !== 0xff || data[1] !== 0xd8) {
    throw new Error('output image is not a JPEG');
  }

  let offset = 2;
  while (offset + 3 < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (data[offset] === 0xff) offset += 1;
    const marker = data[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 1 >= data.length) break;
    const segmentLength = data.readUInt16BE(offset);
    if ((marker === 0xc0 || marker === 0xc2) && segmentLength >= 7 && offset + segmentLength <= data.length) {
      return { height: data.readUInt16BE(offset + 3), width: data.readUInt16BE(offset + 5) };
    }
    offset += segmentLength;
  }
  throw new Error('JPEG SOF0/SOF2 dimensions not found');
}

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
  const dimensions = readJpegDimensions(await readFile(destination));
  console.log(`Wrote ${written.size} bytes to ${destination}`);
  console.log(`Output dimensions: ${dimensions.width}x${dimensions.height}`);
} catch (error) {
  console.error(`Failed to copy entry.png: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
