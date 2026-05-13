import db from "./index.js";

export async function createSchema() {

  // batch table
    await db.run(`
      CREATE TABLE IF NOT EXISTS batch (
      id VARCHAR(255) PRIMARY KEY,
      userId VARCHAR(255),
      urls LONGTEXT, 
      strategy TEXT,
      status TEXT DEFAULT 'running',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`);

    await db.run(`ALTER TABLE batch MODIFY COLUMN urls LONGTEXT`);

    await db.run(`
    CREATE TABLE IF NOT EXISTS scan (
      id VARCHAR(255) PRIMARY KEY,
      batchId VARCHAR(255) NOT NULL,
      userId VARCHAR(255),
      url TEXT NOT NULL,
      deviceType TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (batchId) REFERENCES batch(id) ON DELETE CASCADE
    )
  ENGINE=InnoDB`);

   // Categories table
  await db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(255) PRIMARY KEY,
      scanId VARCHAR(255) NOT NULL,
      performance INTEGER,
      accessibility INTEGER,
      seo INTEGER,
      bestPractices INTEGER,
      FOREIGN KEY (scanId) REFERENCES scan(id) ON DELETE CASCADE
    )
  ENGINE=InnoDB`);

   // Audits table
  await db.run(`
    CREATE TABLE IF NOT EXISTS audits (
      id VARCHAR(255) PRIMARY KEY,
      scanId VARCHAR(255) NOT NULL,
      name TEXT NOT NULL,
      score REAL,
      numericValue REAL,
      displayValue TEXT,
      FOREIGN KEY (scanId) REFERENCES scan(id) ON DELETE CASCADE
    )
  ENGINE=InnoDB`);


   // Core Web Vitals table
  await db.run(`
    CREATE TABLE IF NOT EXISTS coreWebVitals (
      id VARCHAR(255) PRIMARY KEY,
      scanId VARCHAR(255) NOT NULL,
      LCP REAL,
      CLS REAL,
      INP REAL,
      FCP REAL,
      TBT REAL,
      FOREIGN KEY (scanId) REFERENCES scan(id) ON DELETE CASCADE
    )
  ENGINE=InnoDB`);

  // ── Migrate legacy integer id/scanId columns to VARCHAR(255) ──────────────
  // These tables may have been created with AUTO_INCREMENT integer PKs in older
  // schema versions. crypto.randomUUID() silently gets cast to an integer,
  // causing Duplicate entry / Out-of-range errors. Run once; safe to re-run.
  await db.run(`SET FOREIGN_KEY_CHECKS = 0`);
  for (const table of ["categories", "audits", "coreWebVitals"]) {
    try {
      await db.run(
        `ALTER TABLE \`${table}\` MODIFY COLUMN id VARCHAR(255) NOT NULL`,
      );
    } catch (_) { /* already VARCHAR or constraint issue – skip */ }
    try {
      await db.run(
        `ALTER TABLE \`${table}\` MODIFY COLUMN scanId VARCHAR(255) NOT NULL`,
      );
    } catch (_) { /* already VARCHAR – skip */ }
  }
  await db.run(`SET FOREIGN_KEY_CHECKS = 1`);
  // ─────────────────────────────────────────────────────────────────────────


  await db.run(`DROP TABLE IF EXISTS topIssues`);

  await db.run(`
    CREATE TABLE IF NOT EXISTS crawlUrl (
      id VARCHAR(255) PRIMARY KEY,
      hostUrl TEXT NOT NULL,
      allUrls LONGTEXT,
      filteredUrls LONGTEXT,
      totalAll INTEGER DEFAULT 0,
      totalFiltered INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  ENGINE=InnoDB`);

  await db.run(`
    CREATE TABLE IF NOT EXISTS crawl_url_items (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      crawlId VARCHAR(255) NOT NULL,
      url TEXT NOT NULL,
      itemType VARCHAR(20) NOT NULL,
      position INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_crawl_id (crawlId),
      INDEX idx_item_type (itemType),
      FOREIGN KEY (crawlId) REFERENCES crawlUrl(id) ON DELETE CASCADE
    )
  ENGINE=InnoDB`);

}