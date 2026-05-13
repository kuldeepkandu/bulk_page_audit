import db from "../db/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import pLimit from "p-limit";
import crypto from "crypto";
import { Parser } from "json2csv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const runningBatches = new Map();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COMPARE_STORAGE_DIR = path.resolve(__dirname, "../../public/temp");
const COMPARE_STORAGE_FILE = path.join(
  COMPARE_STORAGE_DIR,
  "compare-audits-latest.json",
);

const NON_HTML_FILE_EXTENSIONS = /\.(?:jpg|jpeg|png|gif|svg|webp|ico|pdf|zip|rar|7z|mp3|mp4|avi|mov|wmv|webm|css|js|map|woff|woff2|ttf|eot)$/i;
const CRAWL_RESPONSE_MAX_URLS = Number(process.env.CRAWL_RESPONSE_MAX_URLS || 5000);
const CRAWL_DB_BATCH_SIZE = Number(process.env.CRAWL_DB_BATCH_SIZE || 200);
const MAX_SCAN_URLS = Number(process.env.MAX_SCAN_URLS || 500);
const SCAN_CONCURRENCY = Number(process.env.SCAN_CONCURRENCY || 10);
const BULK_RETRY = Number(process.env.BULK_RETRY || 5);
const PAGESPEED_TIMEOUT_MS = Number(process.env.PAGESPEED_TIMEOUT_MS || 25000);
const PAGESPEED_MAX_RETRIES = Number(process.env.PAGESPEED_MAX_RETRIES || 2);
const PAGESPEED_RETRY_BASE_DELAY_MS = Number(
  process.env.PAGESPEED_RETRY_BASE_DELAY_MS || 1200,
);
const TRACKING_QUERY_PREFIXES = ["utm_", "mc_", "ga_"];
const TRACKING_QUERY_KEYS = new Set([
  "gclid",
  "fbclid",
  "msclkid",
  "dclid",
  "igshid",
  "ref",
  "source",
]);

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "ok",
  });
});

function normalizeUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    parsed.hash = "";
    let normalized = parsed.toString();
    if (normalized.endsWith("/") && parsed.pathname !== "/") {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return null;
  }
}

function extractHrefLinks(html, baseUrl) {
  const links = [];
  const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    const href = (match[1] || "").trim();
    if (!href) continue;
    if (
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      continue;
    }

    try {
      const absolute = new URL(href, baseUrl).toString();
      links.push(absolute);
    } catch {
      continue;
    }
  }

  return links;
}

function dedupeUrls(urls = []) {
  return Array.from(new Set(urls.filter(Boolean)));
}

function normalizeUrlForScan(rawUrl) {
  try {
    const url = new URL(String(rawUrl).trim());

    if (!(url.protocol === "http:" || url.protocol === "https:")) {
      return null;
    }

    url.hash = "";

    const keys = Array.from(url.searchParams.keys());
    for (const key of keys) {
      const normalizedKey = key.toLowerCase();
      const isTrackingPrefix = TRACKING_QUERY_PREFIXES.some((prefix) =>
        normalizedKey.startsWith(prefix),
      );
      if (TRACKING_QUERY_KEYS.has(normalizedKey) || isTrackingPrefix) {
        url.searchParams.delete(key);
      }
    }

    const pathname = url.pathname || "/";
    if (NON_HTML_FILE_EXTENSIONS.test(pathname)) {
      return null;
    }

    let normalized = url.toString();
    if (normalized.endsWith("/") && url.pathname !== "/") {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch {
    return null;
  }
}

function preprocessScanUrls(inputUrls = []) {
  const unique = new Set();

  for (const rawUrl of inputUrls) {
    const normalized = normalizeUrlForScan(rawUrl);
    if (!normalized) continue;
    unique.add(normalized);
  }

  const filtered = Array.from(unique);
  const capped = filtered.slice(0, MAX_SCAN_URLS);

  return {
    urls: capped,
    totalInput: inputUrls.length,
    totalFiltered: filtered.length,
    totalDropped: Math.max(0, inputUrls.length - filtered.length),
    capped: filtered.length > MAX_SCAN_URLS,
  };
}

function isRetriableStatus(statusCode) {
  return statusCode === 429 || statusCode >= 500;
}

function isAbortError(error) {
  return error?.name === "AbortError" || error?.code === "ABORT_ERR";
}

function getBackoffDelay(attempt) {
  return PAGESPEED_RETRY_BASE_DELAY_MS * 2 ** attempt;
}

async function waitForRetry(delayMs, signal) {
  if (!delayMs || delayMs <= 0) return;

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
      resolve();
    }, delayMs);

    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

function splitIntoChunks(items = [], chunkSize = CRAWL_DB_BATCH_SIZE) {
  const chunks = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

async function insertCrawlUrlItems(crawlId, urls, itemType) {
  const chunks = splitIntoChunks(urls, CRAWL_DB_BATCH_SIZE);
  let position = 0;

  for (const chunk of chunks) {
    if (!chunk.length) continue;

    const valuesSql = chunk.map(() => "(?, ?, ?, ?)").join(",");
    const params = [];

    for (const url of chunk) {
      params.push(crawlId, String(url), itemType, position);
      position += 1;
    }

    await db.run(
      `INSERT INTO crawl_url_items (crawlId, url, itemType, position) VALUES ${valuesSql}`,
      params,
    );
  }
}

async function crawlWebsiteUrls(hostUrl, maxPages = 100) {
  const normalizedHost = normalizeUrl(hostUrl);
  if (!normalizedHost) {
    throw new Error("Invalid hostUrl. Please provide a valid URL.");
  }

  const host = new URL(normalizedHost);
  const queue = [normalizedHost];
  const visited = new Set();
  const allDiscovered = [];

  while (queue.length > 0 && visited.size < maxPages) {
    const currentUrl = queue.shift();
    if (!currentUrl || visited.has(currentUrl)) continue;

    visited.add(currentUrl);

    try {
      const response = await fetch(currentUrl, {
        signal: AbortSignal.timeout(10000),
        redirect: "follow",
      });

      if (!response.ok) continue;

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) continue;

      const html = await response.text();
      const links = extractHrefLinks(html, currentUrl);

      for (const link of links) {
        allDiscovered.push(link);

        const normalized = normalizeUrl(link);
        if (!normalized) continue;

        const parsed = new URL(normalized);
        const isSameOrigin = parsed.origin === host.origin;
        const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";
        const isFile = NON_HTML_FILE_EXTENSIONS.test(parsed.pathname);

        if (!isSameOrigin || !isHttp || isFile) continue;

        if (!visited.has(normalized) && !queue.includes(normalized)) {
          queue.push(normalized);
        }
      }
    } catch {
      continue;
    }
  }

  const filteredSet = new Set();
  for (const link of allDiscovered) {
    const normalized = normalizeUrl(link);
    if (!normalized) continue;

    const parsed = new URL(normalized);
    const isSameOrigin = parsed.origin === host.origin;
    const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";
    const isFile = NON_HTML_FILE_EXTENSIONS.test(parsed.pathname);

    if (isSameOrigin && isHttp && !isFile) {
      filteredSet.add(normalized);
    }
  }

  filteredSet.add(normalizedHost);

  return {
    hostUrl: normalizedHost,
    allUrls: allDiscovered,
    filteredUrls: Array.from(filteredSet),
  };
}

const crawlAndStoreUrls = asyncHandler(async (req, res) => {
  const { hostUrl } = req.body;

  if (!hostUrl) {
    return res.status(400).json({
      message: "hostUrl is required",
    });
  }

  const maxPages = Number(process.env.CRAWL_MAX_PAGES || 100);
  const crawlResult = await crawlWebsiteUrls(hostUrl, maxPages);
  const crawlId = crypto.randomUUID();

  const uniqueAllUrls = dedupeUrls(crawlResult.allUrls);
  const uniqueFilteredUrls = dedupeUrls(crawlResult.filteredUrls);

  const responseAllUrls = uniqueAllUrls.slice(0, CRAWL_RESPONSE_MAX_URLS);
  const responseFilteredUrls = uniqueFilteredUrls.slice(0, CRAWL_RESPONSE_MAX_URLS);

  await db.prepare(
    `INSERT INTO crawlUrl (id, hostUrl, allUrls, filteredUrls, totalAll, totalFiltered) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    crawlId,
    crawlResult.hostUrl,
    JSON.stringify([]),
    JSON.stringify([]),
    uniqueAllUrls.length,
    uniqueFilteredUrls.length,
  );

  await insertCrawlUrlItems(crawlId, uniqueAllUrls, "all");
  await insertCrawlUrlItems(crawlId, uniqueFilteredUrls, "filtered");

  res.status(200).json({
    message: "Crawl completed and saved",
    crawlId,
    hostUrl: crawlResult.hostUrl,
    totalAll: uniqueAllUrls.length,
    totalFiltered: uniqueFilteredUrls.length,
    allUrls: responseAllUrls,
    filteredUrls: responseFilteredUrls,
    storedAllCount: uniqueAllUrls.length,
    storedFilteredCount: uniqueFilteredUrls.length,
    storedAsItems: true,
    responseTruncated:
      responseAllUrls.length < uniqueAllUrls.length ||
      responseFilteredUrls.length < uniqueFilteredUrls.length,
  });
});

async function checkSinglePageSpeed(url, strategy = "mobile", signal) {
  const apikey = process.env.PAGESPEED_API_KEY;
  if (!apikey) {
    const message = "PAGESPEED_API_KEY is missing. Please set it in your environment.";
    console.error(message);
    return {
      result: null,
      error: {
        status: 500,
        message,
      },
    };
  }

  const apiurl =
    `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed` +
    `?url=${encodeURIComponent(url)}` +
    `&strategy=${strategy}` +
    `&key=${apikey}` +
    `&locale=en` +
    `&category=performance` +
    `&category=accessibility` +
    `&category=seo` +
    `&category=best-practices`;

  let lastError = null;

  for (let attempt = 0; attempt <= PAGESPEED_MAX_RETRIES; attempt += 1) {
    const timeoutSignal = AbortSignal.timeout(PAGESPEED_TIMEOUT_MS);
    const combinedSignal = signal
      ? AbortSignal.any([signal, timeoutSignal])
      : timeoutSignal;

    try {
      const response = await fetch(apiurl, { signal: combinedSignal });

      if (!response.ok) {
        let detailMessage = "";
        try {
          const errorPayload = await response.json();
          const apiMessage = errorPayload?.error?.message;
          const apiStatus = errorPayload?.error?.status;
          const apiReason = errorPayload?.error?.errors?.[0]?.reason;

          detailMessage = [apiMessage, apiStatus, apiReason]
            .filter(Boolean)
            .join(" | ");
        } catch {
          try {
            const text = await response.text();
            detailMessage = (text || "").slice(0, 300);
          } catch {
            detailMessage = "";
          }
        }

        lastError = {
          status: response.status,
          message: detailMessage
            ? `PageSpeed HTTP ${response.status}: ${detailMessage}`
            : `PageSpeed HTTP ${response.status}`,
        };

        const retriable = isRetriableStatus(response.status);
        if (retriable && attempt < PAGESPEED_MAX_RETRIES) {
          await waitForRetry(getBackoffDelay(attempt), signal);
          continue;
        }

        console.error(
          `${lastError.message} for ${url} (${strategy})`,
        );
        return {
          result: null,
          error: lastError,
        };
      }

      const data = await response.json();
      const LighthouseResult = data?.lighthouseResult;

      if (!LighthouseResult) {
        const message = `PageSpeed response missing lighthouseResult for ${url} (${strategy})`;
        console.error(message);
        return {
          result: null,
          error: {
            status: 502,
            message,
          },
        };
      }

      // Extract core metrics
      const coreWebVitals = {
        LCP:
          LighthouseResult.audits["largest-contentful-paint"]?.numericValue ||
          null,
        CLS:
          LighthouseResult.audits["cumulative-layout-shift"]?.numericValue ||
          null,
        INP:
          LighthouseResult.audits["interaction-to-next-paint"]?.numericValue ||
          null,
        FCP:
          LighthouseResult.audits["first-contentful-paint"]?.numericValue ||
          null,
        TBT:
          LighthouseResult.audits["total-blocking-time"]?.numericValue || null,
      };

      const audits = {};
      for (const key of [
        "largest-contentful-paint",
        "cumulative-layout-shift",
        "interaction-to-next-paint",
        "first-contentful-paint",
        "total-blocking-time",
      ]) {
        const audit = LighthouseResult.audits[key];
        audits[key] = {
          score: audit?.score ?? null,
          numericValue: audit?.numericValue ?? null,
          displayValue: audit?.displayValue ?? "",
        };
      }

      const categories = {
        performance: LighthouseResult.categories.performance?.score * 100 || 0,
        accessibility:
          LighthouseResult.categories.accessibility?.score * 100 || 0,
        seo: LighthouseResult.categories.seo?.score * 100 || 0,
        bestPractices:
          LighthouseResult.categories["best-practices"]?.score * 100 || 0,
      };

      console.log(`check single page url: ${url} and device is ${strategy}`);
      return {
        result: {
          url,
          strategy,
          coreWebVitals,
          audits,
          categories,
        },
        error: null,
      };
    } catch (error) {
      if (isAbortError(error)) {
        if (signal?.aborted) {
          console.log(`Fetch aborted for ${url} (${strategy})`);
          return {
            result: null,
            error: {
              status: 499,
              message: `Fetch aborted for ${url} (${strategy})`,
            },
          };
        }

        if (attempt < PAGESPEED_MAX_RETRIES) {
          await waitForRetry(getBackoffDelay(attempt), signal);
          continue;
        }

        const message = `PageSpeed timeout after retries for ${url} (${strategy})`;
        console.error(message);
        return {
          result: null,
          error: {
            status: 408,
            message,
          },
        };
      }

      if (attempt < PAGESPEED_MAX_RETRIES) {
        await waitForRetry(getBackoffDelay(attempt), signal);
        continue;
      }

      const message = `Error checking PageSpeed for ${url} (${strategy}): ${error.message}`;
      lastError = {
        status: 500,
        message,
      };
      console.error(message);
      return {
        result: null,
        error: lastError,
      };
    }
  }

  return {
    result: null,
    error: lastError || {
      status: 500,
      message: `Unknown PageSpeed failure for ${url} (${strategy})`,
    },
  };
}

async function saveScanResultToDB(scanId, scanResult) {
  const { categories, audits, coreWebVitals } = scanResult;

  // categories
  await db.prepare(
    `INSERT INTO categories (id, scanId, performance, accessibility, seo, bestPractices) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    crypto.randomUUID(),
    scanId,
    categories.performance,
    categories.accessibility,
    categories.seo,
    categories.bestPractices,
  );

  // audits
  for (const [name, audit] of Object.entries(audits)) {
    await db.prepare(
      `INSERT INTO audits (id, scanId, name, score, numericValue, displayValue) VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      crypto.randomUUID(),
      scanId,
      name,
      audit.score,
      audit.numericValue,
      audit.displayValue,
    );
  }

  // core web vitals
  await db.prepare(
    `INSERT INTO coreWebVitals (id, scanId, LCP, CLS, INP, FCP, TBT) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    crypto.randomUUID(),
    scanId,
    coreWebVitals.LCP,
    coreWebVitals.CLS,
    coreWebVitals.INP,
    coreWebVitals.FCP,
    coreWebVitals.TBT,
  );

}

async function clearScanResultData(scanId) {
  await db.prepare("DELETE FROM categories WHERE scanId = ?").run(scanId);
  await db.prepare("DELETE FROM audits WHERE scanId = ?").run(scanId);
  await db.prepare("DELETE FROM coreWebVitals WHERE scanId = ?").run(scanId);
}

async function reconcileBatchStatus(batchId) {
  const batch = await db.prepare("SELECT status FROM batch WHERE id = ?").get(batchId);

  if (!batch) {
    return "not_found";
  }

  if (batch.status === "aborted") {
    return "aborted";
  }

  const openScans = await db
    .prepare(
      "SELECT COUNT(*) AS total FROM scan WHERE batchId = ? AND status IN (?, ?)",
    )
    .get(batchId, "pending", "running");

  const nextStatus = (openScans?.total || 0) > 0 ? "running" : "completed";

  await db.prepare("UPDATE batch SET status = ? WHERE id = ?").run(nextStatus, batchId);

  return nextStatus;
}

async function recoverStaleBatchScans(batchId) {
  if (runningBatches.has(batchId)) {
    return false;
  }

  const staleScans = await db
    .prepare(
      "SELECT id FROM scan WHERE batchId = ? AND status IN (?, ?)",
    )
    .all(batchId, "pending", "running");

  if (!staleScans.length) {
    return false;
  }

  await db
    .prepare(
      "UPDATE scan SET status = ? WHERE batchId = ? AND status IN (?, ?)",
    )
    .run("failed", batchId, "pending", "running");

  await reconcileBatchStatus(batchId);
  return true;
}

async function runRetryForScan(scan, signal) {
  const scanId = scan.id;

  await db.prepare("UPDATE scan SET status = ? WHERE id = ?").run("running", scanId);

  await clearScanResultData(scanId);

  const { result, error } = await checkSinglePageSpeed(
    scan.url,
    scan.deviceType,
    signal,
  );

  if (!result) {
    if (signal?.aborted || error?.status === 499) {
      await db.prepare("UPDATE scan SET status = ? WHERE id = ?").run(
        "aborted",
        scanId,
      );

      const abortError = new DOMException(
        `Retry aborted for url=${scan.url}, deviceType=${scan.deviceType}`,
        "AbortError",
      );
      abortError.cause = error;
      throw abortError;
    }

    await db.prepare("UPDATE scan SET status = ? WHERE id = ?").run("failed", scanId);

    throw new Error(
      `Retry failed for url=${scan.url}, deviceType=${scan.deviceType}. ${error?.message || "PageSpeed did not return a valid result."}`,
    );
  }

  await saveScanResultToDB(scanId, result);

  await db.prepare("UPDATE scan SET status = ? WHERE id = ?").run(
    "completed",
    scanId,
  );

  return {
    scanId,
    status: "completed",
  };
}

async function runBulkRetryScans(batchId, scans = []) {
  const controller = new AbortController();
  runningBatches.set(batchId, controller);

  const limit = pLimit(BULK_RETRY);

  try {
    await Promise.allSettled(
      scans.map((scan) =>
        limit(async () => {
          const latestScan = await db
            .prepare("SELECT * FROM scan WHERE id = ?")
            .get(scan.id);

          if (!latestScan || latestScan.status === "aborted") {
            return;
          }

          if (!["pending", "failed"].includes(latestScan.status)) {
            return;
          }

          try {
            await runRetryForScan(latestScan, controller.signal);
          } catch (error) {
            if (isAbortError(error)) {
              return;
            }

            console.error("Bulk retry error:", {
              message: error.message,
              stack: error.stack,
              scanId: latestScan.id,
              url: latestScan.url,
              deviceType: latestScan.deviceType,
            });
          }
        }),
      ),
    );
  } finally {
    try {
      await reconcileBatchStatus(batchId);
    } catch (error) {
      console.error("Failed to reconcile batch after bulk retry:", error);
    }

    runningBatches.delete(batchId);
  }
}

async function runPageSpeedScans(batchId, urls, strategy, userId) {
  const controller = new AbortController();
  runningBatches.set(batchId, controller);
  const strategies = strategy === "both" ? ["mobile", "desktop"] : [strategy];

  const limit = pLimit(SCAN_CONCURRENCY);

  const tasks = urls.flatMap((url) =>
    strategies.map((deviceType) => ({
      scanId: crypto.randomUUID(),
      batchId,
      userId,
      url,
      deviceType,
    })),
  );

  try {
    for (const task of tasks) {
      await db.prepare(
        `
          INSERT INTO scan 
          (id, batchId, userId, url, deviceType, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
      ).run(
        task.scanId,
        task.batchId,
        task.userId,
        task.url,
        task.deviceType,
        "pending",
      );
    }

    for (const device of strategies) {
      const deviceTasks = tasks.filter((task) => task.deviceType === device);

      await Promise.allSettled(
        deviceTasks.map((task) =>
          limit(async () => {
            try {
              await db.prepare("UPDATE scan SET status=? WHERE id=?").run(
                "running",
                task.scanId,
              );

              const { result, error } = await checkSinglePageSpeed(
                task.url,
                task.deviceType,
                controller.signal,
              );

              if (result) {
                await saveScanResultToDB(task.scanId, result);
                await db.prepare("UPDATE scan SET status=? WHERE id=?").run(
                  "completed",
                  task.scanId,
                );
                return;
              }

              if (error?.message) {
                console.error(
                  `Scan failed for ${task.url} (${task.deviceType}): ${error.message}`,
                );
              }

              await db.prepare("UPDATE scan SET status=? WHERE id=?").run(
                "failed",
                task.scanId,
              );
            } catch (taskError) {
              console.error(
                `Unexpected scan task error for ${task.url} (${task.deviceType}):`,
                taskError,
              );
              await db.prepare("UPDATE scan SET status=? WHERE id=?").run(
                "failed",
                task.scanId,
              );
            }
          }),
        ),
      );
    }
  } catch (error) {
    if (error.name === "AbortError") {
      const batch = await db
        .prepare(`SELECT status FROM batch WHERE id=?`)
        .get(batchId);
      if (batch && batch.status !== "aborted") {
        await db.prepare(`UPDATE batch SET status=? WHERE id=?`).run(
          "aborted",
          batchId,
        );
      }
      console.log("Batch aborted:", batchId);
    } else {
      console.error("Batch error:", error);
    }
  } finally {
    try {
      await reconcileBatchStatus(batchId);
    } catch (finalizeError) {
      console.error("Failed to reconcile batch status:", finalizeError);
    }

    runningBatches.delete(batchId);
  }
}

const checkPageSpeedBatch = asyncHandler(async (req, res) => {
  const { urls, strategy = "mobile" } = req.body;
  if (!urls || !urls.length)
    return res.status(400).json({ message: "urls are required" });

  const normalizedStrategy = ["mobile", "desktop", "both"].includes(strategy)
    ? strategy
    : "mobile";

  const preprocessed = preprocessScanUrls(urls);
  if (!preprocessed.urls.length) {
    return res.status(400).json({
      message: "No valid URLs after filtering. Please enter valid page URLs.",
    });
  }

  const batchId = crypto.randomUUID();
  const userId = 1;

  await db.prepare(
    `INSERT INTO batch (id, userId, status, urls, strategy) VALUES (?, ?, ?, ?, ?)`,
  ).run(
    batchId,
    userId,
    "running",
    JSON.stringify(preprocessed.urls),
    normalizedStrategy,
  );

  runPageSpeedScans(batchId, preprocessed.urls, normalizedStrategy, userId);
  res.status(200).json({
    message: "PageSpeed scan started",
    batchId,
    summary: {
      totalInput: preprocessed.totalInput,
      totalFiltered: preprocessed.totalFiltered,
      totalDropped: preprocessed.totalDropped,
      capped: preprocessed.capped,
      maxScanUrls: MAX_SCAN_URLS,
      strategy: normalizedStrategy,
      scanConcurrency: SCAN_CONCURRENCY,
    },
  });
});

const abortScan = asyncHandler(async (req, res) => {
  const { batchId } = req.params;

  const batch = await db
    .prepare("SELECT id, status FROM batch WHERE id = ?")
    .get(batchId);

  if (!batch) {
    return res.status(404).json({
      message: "Batch not found",
      status: "not_found",
    });
  }

  if (batch.status === "aborted") {
    return res.status(200).json({
      message: "Batch already aborted",
      batchId,
      status: "aborted",
    });
  }

  if (batch.status === "completed") {
    return res.status(200).json({
      message: "Batch already completed. Abort not needed.",
      batchId,
      status: "completed",
    });
  }

  const controller = runningBatches.get(batchId);
  if (controller) {
    controller.abort();
    runningBatches.delete(batchId);
  }

  await db.prepare("UPDATE batch SET status=? WHERE id=?").run("aborted", batchId);
  await db
    .prepare(
      "UPDATE scan SET status=? WHERE batchId=? AND status IN (?, ?)",
    )
    .run("aborted", batchId, "pending", "running");

  res.status(200).json({
    message: controller ? "Batch aborted" : "Batch marked as aborted",
    batchId,
    status: "aborted",
  });
});

//fetch scan results
const getMultipleScanResults = asyncHandler(async (req, res) => {
  const { batchId } = req.params;

  if (!batchId) {
    return res.status(400).json({ message: "batchId is required" });
  }

  try {
    const batch = await db.prepare("SELECT * FROM batch WHERE id = ?").get(batchId);

    if (!batch) {
      return res.status(404).json({
        message: "Batch not found",
        status: "not_found",
      });
    }
    if (batch.status === "running") {
      await recoverStaleBatchScans(batchId);
    }

    const latestBatch = await db.prepare("SELECT * FROM batch WHERE id = ?").get(batchId);
    const allUrls = JSON.parse(latestBatch.urls || "[]");
    const Batchstatus = latestBatch.status;
    const userId = latestBatch.userId;

    const scans = await db
      .prepare("SELECT * FROM scan WHERE batchId = ? ORDER BY createdAt ASC")
      .all(batchId);
    if (!scans || !scans.length) {
      return res.status(404).json({
        message: "No scans found for this batchId",
        status: "scan_not_found",
      });
    }

    const totalTasks = scans.length;
    const completedTasks = scans.filter((s) => s.status === "completed").length;
    const completedUrls = scans.filter((s) => s.status === "completed");
    const runningTasks = scans.filter((s) => s.status === "running").length;
    const pendingTasks = scans.filter((s) => s.status === "pending").length;
    const failedTasks = scans.filter((s) => s.status === "failed").length;
    const abortedTasks = scans.filter((s) => s.status === "aborted").length;
    const processedTasks = totalTasks - runningTasks - pendingTasks;

    const progressPercentage =
      totalTasks === 0 ? 0 : Math.round((processedTasks / totalTasks) * 100);

    const groupedByUrl = {};

    for (const scan of scans) {
      if (!groupedByUrl[scan.url]) {
        groupedByUrl[scan.url] = {
          url: scan.url,
          scans: {},
        };
      }

      const scanId = scan.id;

      const categories = await db
        .prepare("SELECT * FROM categories WHERE scanId = ?")
        .get(scanId);

      const audits = await db
        .prepare("SELECT * FROM audits WHERE scanId = ?")
        .all(scanId);

      const coreWebVitals = await db
        .prepare("SELECT * FROM coreWebVitals WHERE scanId = ?")
        .get(scanId);

      groupedByUrl[scan.url].scans[scan.deviceType] = {
        scanId,
        deviceType: scan.deviceType,
        status: scan.status,
        createdAt: scan.createdAt,
        categories,
        audits,
        coreWebVitals,
      };
    }

    res.status(200).json({
      message: "ok",
      userId: userId,
      batchId,
      allUrls,
      completedUrls,
      totalUrls: allUrls.length,
      totalTasks,
      processedTasks,
      completedTasks,
      runningTasks,
      pendingTasks,
      failedTasks,
      abortedTasks,
      progressPercentage,
      status: Batchstatus || "unknown",
      data: Object.values(groupedByUrl),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const getAllScanHistory = asyncHandler(async (req, res) => {
  try {
    let {
      url,
      deviceType,
      date,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    // base query
    let baseQuery = "FROM scan WHERE 1=1";
    let params = [];

    // Filters
    if (url) {
      baseQuery += " AND url = ?";
      params.push(url);
    }

    if (deviceType) {
      baseQuery += " AND deviceType = ?";
      params.push(deviceType);
    }

    if (date) {
      baseQuery += " AND DATE(createdAt) = DATE(?)";
      params.push(date);
    } else if (startDate && endDate) {
      baseQuery += " AND DATE(createdAt) BETWEEN DATE(?) AND DATE(?)";
      params.push(startDate, endDate);
    }

    //  get total count for pagination
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const totalRow = await db.prepare(countQuery).get(...params);
    const total = totalRow?.total || 0;

    if (total === 0) {
      return res.status(404).json({
        message: "No scan history found",
      });
    }

    const totalPages = Math.ceil(total / limit);

    // get paginated scans
    const dataQuery = `
            SELECT * ${baseQuery}
            ORDER BY url ASC
            LIMIT ? OFFSET ?
        `;

    const scans = await db.prepare(dataQuery).all(...params, limit, offset);

    const result = {};

    for (const scan of scans) {
      const scanUrl = scan.url;
      const scanId = scan.id;

      if (!result[scanUrl]) {
        result[scanUrl] = {
          url: scanUrl,
          scans: {},
        };
      }

      // Fetch related tables
      const categories = await db
        .prepare("SELECT * FROM categories WHERE scanId = ?")
        .get(scanId);

      const audits = await db
        .prepare("SELECT * FROM audits WHERE scanId = ?")
        .all(scanId);

      const coreWebVitals = await db
        .prepare("SELECT * FROM coreWebVitals WHERE scanId = ?")
        .get(scanId);

      // Assign within scanId group
      result[scanUrl].scans[scanId] = {
        scanId,
        deviceType: scan.deviceType,
        createdAt: scan.createdAt,
        categories,
        audits,
        coreWebVitals,
      };
    }

    res.status(200).json({
      message: "ok",
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      data: Object.values(result),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const retryFailedScan = asyncHandler(async (req, res) => {
  const { scanId } = req.body;

  if (!scanId) {
    return res.status(400).json({
      message: "Scan Id is required !!",
    });
  }

  const scan = await db.prepare("SELECT * FROM scan WHERE id = ?").get(scanId);

  if (!scan) {
    return res.status(400).json({
      message: "Scan not found !!",
    });
  }

  if (scan.status !== "failed") {
    return res.status(400).json({
      message: "Only failed scan can be retried !!",
    });
  }

  try {
    const retryController = new AbortController();
    runningBatches.set(scan.batchId, retryController);

    await db.prepare("UPDATE batch SET status = ? WHERE id = ?").run(
      "running",
      scan.batchId,
    );

    await runRetryForScan(scan, retryController.signal);
    await reconcileBatchStatus(scan.batchId);

    res.status(200).json({
      message: "Scan retried successfully",
      scanId,
    });
  } catch (error) {
    await reconcileBatchStatus(scan.batchId);

    console.error("Retry error:", {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
      scanId,
      url: scan.url,
      deviceType: scan.deviceType,
    });

    res.status(500).json({
      message: "Retry failed again",
      error: error.message,
    });
  } finally {
    runningBatches.delete(scan.batchId);
  }
});

const retryFailedScansBulk = asyncHandler(async (req, res) => {
  const { batchId } = req.body;

  if (!batchId) {
    return res.status(400).json({
      message: "Batch Id is required !!",
    });
  }

  const batch = await db.prepare("SELECT * FROM batch WHERE id = ?").get(batchId);

  if (!batch) {
    return res.status(404).json({
      message: "Batch not found !!",
      status: "not_found",
    });
  }

  if (batch.status === "aborted") {
    return res.status(400).json({
      message: "Aborted batch cannot be retried !!",
    });
  }

  const failedScans = await db
    .prepare("SELECT * FROM scan WHERE batchId = ? AND status = ? ORDER BY createdAt ASC")
    .all(batchId, "failed");

  if (!failedScans.length) {
    return res.status(400).json({
      message: "No failed scans found for this batch !!",
    });
  }

  await db.prepare("UPDATE batch SET status = ? WHERE id = ?").run("running", batchId);
  await db
    .prepare("UPDATE scan SET status = ? WHERE batchId = ? AND status = ?")
    .run("pending", batchId, "failed");

  runBulkRetryScans(batchId, failedScans);

  return res.status(202).json({
    message: "Bulk retry started",
    batchId,
    retryCount: failedScans.length,
    bulkRetryConcurrency: BULK_RETRY,
    status: "running",
  });
});

const getUniqueUrls = async (req, res) => {
  try {
    const urls = await db.prepare("SELECT DISTINCT url FROM scan").all();
    res.status(200).json({
      success: true,
      data: urls,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const exportToCsv = asyncHandler(async (req, res) => {
  const { userId, batchId } = req.body;

  if (!userId && !batchId) {
    return res.status(400).json({
      message: "UserId & batchId is required",
    });
  }

  try {
    const batch = await db.prepare("SELECT * FROM batch WHERE id = ?").get(batchId);
    if (!batch) {
      return res.status(404).json({
        message: "Batch id is not found",
        status: "not_found",
      });
    }
    const Batchstatus = batch.status;

    const scans = await db
      .prepare("SELECT * FROM scan WHERE batchId = ? ORDER BY createdAt ASC")
      .all(batchId);
    if (!scans || !scans.length) {
      return res.status(404).json({
        message: "No scans found for this batchId",
        status: "scan_not_found",
      });
    }

    const rows = [];

    // const groupedByUrl = {};

    for (const scan of scans) {
      // if (!groupedByUrl[scan.url]) {
      //   groupedByUrl[scan.url] = {
      //     url: scan.url,
      //     scans: {},
      //   };
      // }

      const scanId = scan.id;

      const categories = await db
        .prepare("SELECT * FROM categories WHERE scanId = ?")
        .get(scanId);

      const audits = await db
        .prepare("SELECT * FROM audits WHERE scanId = ?")
        .all(scanId);

      const coreWebVitals = await db
        .prepare("SELECT * FROM coreWebVitals WHERE scanId = ?")
        .get(scanId);

      /*  groupedByUrl[scan.url].scans[scan.deviceType] = {
        scanId,
        deviceType: scan.deviceType,
        status: scan.status,
        createdAt: scan.createdAt,
        categories,
        audits,
        coreWebVitals,
      }; */
      rows.push({
        Id: scanId,
        url: scan.url,
        deviceType: scan.deviceType,
        status: scan.status,
        createdAt: scan.createdAt,

        performance: categories?.performance || "",
        seo: categories?.seo || "",
        accessibility: categories?.accessibility || "",
        bestPractices: categories?.bestPractices || "",

        LCP:
          coreWebVitals?.LCP != null
            ? Math.floor((coreWebVitals?.LCP / 1000) * 1000) / 1000
            : 0,
        CLS:
          coreWebVitals?.CLS != null
            ? Math.floor(coreWebVitals?.CLS * 10000) / 10000
            : 0,
        INP:
          coreWebVitals?.INP != null
            ? Math.floor((coreWebVitals?.INP / 1000) * 100) / 100
            : 0,
        FCP:
          coreWebVitals?.FCP != null
            ? Math.floor((coreWebVitals?.FCP / 1000) * 100) / 100
            : 0,
        TBT:
          coreWebVitals?.TBT != null
            ? Math.floor((coreWebVitals?.TBT / 1000) * 10000) / 10000
            : 0,
      });
    }

    const json2csv = new Parser();
    const csv = json2csv.parse(rows);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="batch_${batchId}.csv"`,
    );

    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const exportToCsvScan = asyncHandler(async (req, res) => {
  const { userId, scanId } = req.body;

  if (!userId && scanId) {
    return res.status(400).json({
      message: "User id and scan id is required",
    });
  }

  try {
    const scan = await db.prepare(`SELECT * FROM scan WHERE id = ?`).get(scanId);

    if (!scan) {
      return res.status(404).json({
        message: "No scan data found for this id",
      });
    }

    const rows = [];

    const categories = await db
      .prepare("SELECT * FROM categories WHERE scanId = ?")
      .get(scanId);

    const audits = await db
      .prepare("SELECT * FROM audits WHERE scanId = ?")
      .all(scanId);

    const coreWebVitals = await db
      .prepare("SELECT * FROM coreWebVitals WHERE scanId = ?")
      .get(scanId);

    rows.push({
      Id: scanId,
      url: scan.url,
      deviceType: scan.deviceType,
      status: scan.status,
      createdAt: scan.createdAt,

      performance: categories?.performance || "",
      seo: categories?.seo || "",
      accessibility: categories?.accessibility || "",
      bestPractices: categories?.bestPractices || "",

      LCP:
        coreWebVitals?.LCP != null
          ? Math.floor((coreWebVitals?.LCP / 1000) * 1000) / 1000
          : 0,
      CLS:
        coreWebVitals?.CLS != null
          ? Math.floor(coreWebVitals?.CLS * 10000) / 10000
          : 0,
      INP:
        coreWebVitals?.INP != null
          ? Math.floor((coreWebVitals?.INP / 1000) * 100) / 100
          : 0,
      FCP:
        coreWebVitals?.FCP != null
          ? Math.floor((coreWebVitals?.FCP / 1000) * 100) / 100
          : 0,
      TBT:
        coreWebVitals?.TBT != null
          ? Math.floor((coreWebVitals?.TBT / 1000) * 10000) / 10000
          : 0,
    });

    const json2csv = new Parser();
    const csv = json2csv.parse(rows);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="scan_${scanId}.csv"`,
    );

    res.status(200).send(csv);
  } catch (error) {
    console.log("Failed to export in csv: ", error);
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

const testEndpoint = asyncHandler(async (req, res) => {
  try {
    const batchs = await db.prepare("SELECT * FROM batch").all();
    const scans = await db.prepare("SELECT * FROM scan").all();
    const categories = await db.prepare("SELECT * FROM categories").all();
    const audits = await db.prepare("SELECT * FROM audits").all();
    const coreWebVitals = await db.prepare("SELECT * FROM coreWebVitals").all();
    const crawlUrls = await db.prepare("SELECT * FROM crawlUrl").all();
    const crawlUrlItemsCountRow = await db
      .prepare("SELECT COUNT(*) AS total FROM crawl_url_items")
      .get();

    res.json({
      batchs,
      scans,
      categories,
      audits,
      coreWebVitals,
      crawlUrls,
      crawlUrlItemsCount: crawlUrlItemsCountRow?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const testbodyparser = asyncHandler(async (req, res) => {
  console.log("Body", req.body);
  res.json({ body: req.body });
});

const SCORE_METRICS = [
  "performance",
  "seo",
  "accessibility",
  "bestpractices",
];
const CWV_METRICS = ["lcp", "cls", "inp", "fcp", "tbt"];
const ALL_COMPARE_METRICS = [...SCORE_METRICS, ...CWV_METRICS];

function normalizeCsvHeader(header) {
  return String(header ?? "")
    .trim()
    .toLowerCase()
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, "");
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCompareKey(url, deviceType) {
  return `${String(url ?? "").trim()}||${String(deviceType ?? "mobile")
    .trim()
    .toLowerCase()}`;
}

function parseCSV(csvText) {
  const normalizedText = String(csvText ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!normalizedText) return [];

  const lines = normalizedText.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map(normalizeCsvHeader);
  const rows = [];

  for (let index = 1; index < lines.length; index += 1) {
    const values = splitCsvLine(lines[index]);
    const row = {};

    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] ?? "";
    });

    if (!row.url) continue;

    if (!row.devicetype && row.device) row.devicetype = row.device;
    row.url = String(row.url).trim();
    row.devicetype = String(row.devicetype || "mobile").trim().toLowerCase();

    for (const metric of ALL_COMPARE_METRICS) {
      row[metric] = toNumberOrNull(row[metric]);
    }

    rows.push(row);
  }

  return rows;
}

function buildAuditComparison(beforeRows, afterRows) {
  const beforeMap = new Map(
    beforeRows.map((row) => [normalizeCompareKey(row.url, row.devicetype), row]),
  );
  const afterMap = new Map(
    afterRows.map((row) => [normalizeCompareKey(row.url, row.devicetype), row]),
  );
  const allKeys = new Set([...beforeMap.keys(), ...afterMap.keys()]);

  const compared = [];
  const added = [];
  const removed = [];

  for (const key of allKeys) {
    const beforeRow = beforeMap.get(key);
    const afterRow = afterMap.get(key);

    if (!beforeRow && afterRow) {
      added.push({ url: afterRow.url, deviceType: afterRow.devicetype });
      continue;
    }

    if (beforeRow && !afterRow) {
      removed.push({ url: beforeRow.url, deviceType: beforeRow.devicetype });
      continue;
    }

    const metrics = {};
    for (const metric of ALL_COMPARE_METRICS) {
      const beforeValue = beforeRow?.[metric] ?? null;
      const afterValue = afterRow?.[metric] ?? null;
      metrics[metric] = {
        before: beforeValue,
        after: afterValue,
        delta:
          beforeValue === null || afterValue === null
            ? null
            : Number((afterValue - beforeValue).toFixed(4)),
      };
    }

    compared.push({
      url: afterRow.url,
      deviceType: afterRow.devicetype,
      metrics,
    });
  }

  compared.sort((a, b) =>
    `${a.url}|${a.deviceType}`.localeCompare(`${b.url}|${b.deviceType}`),
  );
  added.sort((a, b) => `${a.url}|${a.deviceType}`.localeCompare(`${b.url}|${b.deviceType}`));
  removed.sort((a, b) => `${a.url}|${a.deviceType}`.localeCompare(`${b.url}|${b.deviceType}`));

  return { compared, added, removed };
}

async function writeLatestComparePayload(payload) {
  await fs.mkdir(COMPARE_STORAGE_DIR, { recursive: true });
  await fs.writeFile(COMPARE_STORAGE_FILE, JSON.stringify(payload, null, 2), "utf-8");
}

async function readLatestComparePayload() {
  const raw = await fs.readFile(COMPARE_STORAGE_FILE, "utf-8");
  return JSON.parse(raw);
}

const compareAudits = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.before || !req.files.after) {
    return res.status(400).json({
      message: "Both before and after CSV files are required",
    });
  }

  const beforeCSV = req.files.before[0].buffer.toString("utf-8");
  const afterCSV = req.files.after[0].buffer.toString("utf-8");

  const beforeRows = parseCSV(beforeCSV);
  const afterRows = parseCSV(afterCSV);

  if (!beforeRows.length) {
    return res.status(400).json({ message: "Before CSV has no valid data rows." });
  }

  if (!afterRows.length) {
    return res.status(400).json({ message: "After CSV has no valid data rows." });
  }

  const comparison = buildAuditComparison(beforeRows, afterRows);
  const payload = {
    summary: {
      before: beforeRows.length,
      after: afterRows.length,
      compared: comparison.compared.length,
      added: comparison.added.length,
      removed: comparison.removed.length,
    },
    ...comparison,
    savedAt: new Date().toISOString(),
  };

  await writeLatestComparePayload(payload);

  return res.status(200).json({
    message: "Audit comparison completed",
    ...payload,
  });
});

const getLatestComparedAudits = asyncHandler(async (_req, res) => {
  try {
    const payload = await readLatestComparePayload();
    return res.status(200).json(payload);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return res.status(404).json({ message: "No saved audit comparison found" });
    }

    throw error;
  }
});

const clearLatestComparedAudits = asyncHandler(async (_req, res) => {
  try {
    await fs.unlink(COMPARE_STORAGE_FILE);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  return res.status(200).json({ message: "Saved audit comparison cleared" });
});

export {
  registerUser,
  crawlAndStoreUrls,
  checkPageSpeedBatch,
  abortScan,
  testEndpoint,
  getMultipleScanResults,
  getAllScanHistory,
  getUniqueUrls,
  retryFailedScan,
  retryFailedScansBulk,
  exportToCsv,
  testbodyparser,
  exportToCsvScan,
  compareAudits,
  getLatestComparedAudits,
  clearLatestComparedAudits,
};
