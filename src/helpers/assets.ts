/**
 * Loads HTML content from Cloudflare Assets binding.
 * Assets binding expects absolute URL, so we use a placeholder origin.
 */
export type AssetsBinding = Fetcher;

export async function loadHtml(
  assets: AssetsBinding | undefined,
  htmlPath: string
): Promise<string> {
  if (!assets) {
    throw new Error(
      "ASSETS binding not available. Ensure wrangler.jsonc includes assets configuration."
    );
  }

  // Cloudflare Assets expects absolute URL
  const buildRequest = (path: string) =>
    new Request(new URL(path, "https://assets.invalid").toString());

  const htmlResponse = await assets.fetch(buildRequest(htmlPath));

  if (!htmlResponse.ok) {
    throw new Error(
      `Failed to fetch HTML from assets: ${htmlPath} (Status: ${htmlResponse.status})`
    );
  }

  return await htmlResponse.text();
}
