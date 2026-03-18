import { SDK } from "caido:plugin";
import { addFindings } from "./routes/addFindings";

/**
 * Loads sample data into the current project for testing
 * 
 * @param sdk - The Caido SDK instance
 * @param addFindings - The addFindings function to use
 * @returns Promise with success status and count
 */
export async function loadSampleData(sdk: SDK) {
  // Note: Sample data will be loaded into the current active project

  try {
    // Generate 100 sample findings
    const sampleData: any[] = [];
    const tags = ['XSS', 'PSMG', 'CSPP', 'MISC', 'COOKIE'];
    const types = ['attribute', 'function', 'event', 'class'];
    const sinks = ['innerHTML', 'eval', 'document.write', 'setTimeout', 'setInterval'];
    const frames = ['top', 'top.frame[0]', 'top.frame[1]', 'top.frame[2]'];

    for (let i = 1; i <= 100; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const tag = tags[Math.floor(Math.random() * tags.length)];
      const sink = sinks[Math.floor(Math.random() * sinks.length)];
      const frame = frames[Math.floor(Math.random() * frames.length)];

      sampleData.push({
        dupKey: `sample-${i}-${Date.now()}`,
        debug: `Debug info for finding ${i}`,
        alert: Math.random() > 0.5,
        tag: tag || 'Info',
        type: type || 'Unknown',
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        href: `https://example.com/page${i}`,
        frame: frame || 'main',
        sink: sink || 'unknown',
        data: `Sample data for finding ${i}` + "a".repeat(1000) + "z",
        trace: `Trace information for finding ${i}`,
        favorite: false
      });
    }

    // Add findings in batches of 10
    let successCount = 0;
    let processed = 0;
    const batchSize = 10;

    for (let i = 0; i < sampleData.length; i += batchSize) {
      const batch = sampleData.slice(i, i + batchSize);
      const result = await addFindings(sdk, { findings: batch });

      if (result.success) {
        successCount += result.count || 0;
      }

      processed += batch.length;

      // Log progress
      sdk.console.log(`Processed ${processed}/${sampleData.length} findings`);
    }

    sdk.console.log(`Successfully loaded ${successCount} sample findings`);

    return { success: true, count: successCount };
  } catch (error) {
    sdk.console.error(`Failed to load sample data: ${error}`);

    return { success: false, error: String(error) };
  }
}
