/**
 * SHL Catalog → Embeddings → Qdrant
 * ===================================
 * Model  : Xenova/bge-large-en-v1.5 (1024 dims, best free local quality)
 * Usage  : node embed_and_store.js
 *
 * First run downloads ~600MB model, cached after that.
 * Re-running is safe — upsert is idempotent.
 */

import { pipeline } from "@xenova/transformers";
import { QdrantClient } from "@qdrant/js-client-rest";
import { readFileSync } from "fs";
import { ENV } from "../config/env.js";

const COLLECTION_NAME = "shl_assessments";
const VECTOR_SIZE = 1024;  // bge-large-en-v1.5
const BATCH_SIZE = 16;    // smaller batch since model is larger

const client = new QdrantClient({
  url: ENV.qdrantUrl,
  apiKey: ENV.qdrantApiKey,
});

// ── Text to embed ──────────────────────────────────────────────────────────────
function buildDocText(a) {
  const typeLabels = a.test_types.map((t) => t.label).join(", ");
  const parts = [
    `Assessment name: ${a.name}`,
    typeLabels ? `Test types: ${typeLabels}` : "",
    a.remote_testing ? "Available for remote testing" : "Not available for remote testing",
    a.adaptive_irt ? "Uses adaptive IRT technology" : "",
    a.description ? `Description: ${a.description}` : "",
  ];
  return parts.filter(Boolean).join(". ");
}

// ── Embed batch ────────────────────────────────────────────────────────────────
async function embedBatch(embedder, texts) {
  const output = await embedder(texts, { pooling: "mean", normalize: true });
  return Array.from({ length: texts.length }, (_, i) =>
    Array.from(output[i].data)
  );
}

// ── Ensure collection ──────────────────────────────────────────────────────────
async function ensureCollection() {
  const { collections } = await client.getCollections();
  const exists = collections.some((c) => c.name === COLLECTION_NAME);

  if (exists) {
    console.log(`✓ Collection "${COLLECTION_NAME}" already exists — will upsert`);
    return;
  }

  await client.createCollection(COLLECTION_NAME, {
    vectors: { size: VECTOR_SIZE, distance: "Cosine" },
  });

  // Payload indexes for fast filtering
  await client.createPayloadIndex(COLLECTION_NAME, {
    field_name: "is_remote",
    field_schema: "bool",
  });
  await client.createPayloadIndex(COLLECTION_NAME, {
    field_name: "is_adaptive",
    field_schema: "bool",
  });
  await client.createPayloadIndex(COLLECTION_NAME, {
    field_name: "type_codes_list",
    field_schema: "keyword",
  });

  console.log(`✓ Created collection "${COLLECTION_NAME}" with indexes`);
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Load catalog
  const raw = readFileSync("./seed/data.min.json", "utf-8");
  const catalog = JSON.parse(raw);
  const assessments = catalog.assessments;
  console.log(`Loaded ${assessments.length} assessments\n`);

  // 2. Load model
  console.log("Loading Xenova/bge-large-en-v1.5 (1024 dims)...");
  console.log("First run downloads ~600MB — subsequent runs use local cache.\n");
  const embedder = await pipeline(
    "feature-extraction",
    "Xenova/bge-large-en-v1.5"
  );
  console.log("✓ Model ready\n");

  // 3. Ensure collection exists in Qdrant
  await ensureCollection();

  // 4. Embed + upsert in batches
  console.log(`Embedding ${assessments.length} assessments in batches of ${BATCH_SIZE}...\n`);
  let done = 0;

  for (let i = 0; i < assessments.length; i += BATCH_SIZE) {
    const batch = assessments.slice(i, i + BATCH_SIZE);
    const texts = batch.map(buildDocText);
    const vectors = await embedBatch(embedder, texts);

    const points = batch.map((a, j) => ({
      id: i + j + 1,  // stable integer ID
      vector: vectors[j],
      payload: {
        name: a.name,
        url: a.url,
        remote_testing: a.remote_testing,
        adaptive_irt: a.adaptive_irt,
        test_type_codes: a.test_type_codes,
        test_types: a.test_types,
        description: a.description || "",
        // Indexed fields used in filters
        is_remote: a.remote_testing,
        is_adaptive: a.adaptive_irt,
        type_codes_list: a.test_type_codes.split(" ").filter(Boolean),
      },
    }));

    await client.upsert(COLLECTION_NAME, { wait: true, points });

    done += batch.length;
    const pct = Math.round((done / assessments.length) * 100);
    console.log(`  [${String(done).padStart(3)}/${assessments.length}] ${pct}%  "${batch[0].name}"`);
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`✓ ${done} assessments stored in Qdrant`);
  console.log(`  Collection : ${COLLECTION_NAME}`);
  console.log(`  Dimensions : ${VECTOR_SIZE}`);
  console.log(`  Distance   : Cosine`);
  console.log(`${"=".repeat(50)}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});