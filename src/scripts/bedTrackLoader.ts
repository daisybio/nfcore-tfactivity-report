import { inflate } from 'pako';

/**
 * Decompresses BED text that was compressed server-side
 * @param compressedText - Base64 encoded gzipped text or plain text
 * @returns Decompressed BED text
 */
function decompressBedText(compressedText: string): string {
  try {
    // Check if it's actually compressed (base64 encoded)
    if (compressedText.indexOf('\n') !== -1 || compressedText.indexOf('\t') !== -1) {
      // Not compressed, return as is
      return compressedText;
    }
    
    // Decode base64
    const binaryString = atob(compressedText);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Decompress using pako
    const decompressed = inflate(bytes, { to: 'string' });
    return decompressed;
  } catch (e) {
    console.warn('Failed to decompress BED text, using original:', e);
    return compressedText;
  }
}

/**
 * Loads BED tracks into Visage browser component
 * @param serverBedTracks - Compressed BED tracks from server
 * @param serverBedCandidateTracks - Compressed candidate region tracks from server
 */
export function loadBedTracksIntoVisage(serverBedTracks: any[], serverBedCandidateTracks: any[]) {
  try {
    const browserEl = document.getElementById('visage-browser');
    if (browserEl) {
      // Decompress BED tracks
      const decompressedTracksA = Array.isArray(serverBedTracks) 
        ? serverBedTracks.map(t => ({
            name: t.name,
            text: decompressBedText(t.compressedText),
            format: t.format
          }))
        : [];
      
      const decompressedTracksB = Array.isArray(serverBedCandidateTracks)
        ? serverBedCandidateTracks.map(t => ({
            name: t.name,
            text: decompressBedText(t.compressedText),
            format: t.format
          }))
        : [];
      
      // Create blobs from decompressed text
      const blobsA = decompressedTracksA.map(t => ({ 
        name: t.name, 
        url: URL.createObjectURL(new Blob([t.text], { type: 'text/plain' })), 
        format: t.format 
      }));
      const blobsB = decompressedTracksB.map(t => ({ 
        name: t.name, 
        url: URL.createObjectURL(new Blob([t.text], { type: 'text/plain' })), 
        format: t.format 
      }));
      
      const blobs = [...blobsA, ...blobsB];
      const tracks = blobs.map(b => ({ name: b.name, type: 'annotation', format: b.format, url: b.url }));
      browserEl.setAttribute('tracks', JSON.stringify(tracks));
      window.addEventListener('beforeunload', () => {
        blobs.forEach(b => URL.revokeObjectURL(b.url));
      });
    }
  } catch (e) {
    console.error('Error processing BED tracks:', e);
  }
}

// Make function available globally for use in inline scripts
(window as any).loadBedTracksIntoVisage = loadBedTracksIntoVisage;
