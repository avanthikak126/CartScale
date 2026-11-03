// Pre-change analysis: inspect products for cleanup
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    if (process.env.TEST_EMAIL && process.env.TEST_PASSWORD) {
        await supabase.auth.signInWithPassword({
            email: process.env.TEST_EMAIL,
            password: process.env.TEST_PASSWORD
        });
    }

    // 1. All products
    const { data: products } = await supabase
        .from("products")
        .select("id, name, description, price, category_id, created_at")
        .order("id", { ascending: true });

    console.log(`Total products: ${products.length}`);

    // 2. Find test/demo products
    console.log("\n=== POTENTIAL TEST/DEMO PRODUCTS ===");
    const testPatterns = [/^test\s/i, /^demo\s/i, /^sample\s/i, /^example\s/i, /test product/i, /dummy/i];
    const testProducts = products.filter(p => testPatterns.some(re => re.test(p.name)));
    testProducts.forEach(p => console.log(`  id=${p.id}  name="${p.name}"  price=${p.price}  cat=${p.category_id}`));

    // 3. Find duplicate names
    console.log("\n=== DUPLICATE PRODUCT NAMES ===");
    const nameCounts = {};
    for (const p of products) {
        const key = (p.name || "").toLowerCase().trim();
        if (!nameCounts[key]) nameCounts[key] = [];
        nameCounts[key].push(p);
    }
    const dupes = Object.entries(nameCounts).filter(([, rows]) => rows.length > 1);
    for (const [name, rows] of dupes) {
        console.log(`  "${name}" (${rows.length} copies):`);
        for (const r of rows) {
            console.log(`    id=${r.id}  price=${r.price}  cat=${r.category_id}  desc="${(r.description || "").substring(0, 50)}"`);
        }
    }

    // 4. Check which products are referenced by orders/carts
    console.log("\n=== PRODUCTS REFERENCED BY ORDER_ITEMS ===");
    const { data: orderItems } = await supabase.from("order_items").select("product_id");
    const orderedIds = new Set((orderItems || []).map(o => o.product_id));
    console.log(`  Products in order_items: ${orderedIds.size} unique IDs`);
    if (orderedIds.size > 0) console.log(`  IDs: ${[...orderedIds].join(", ")}`);

    console.log("\n=== PRODUCTS REFERENCED BY CART_ITEMS ===");
    const { data: cartItems } = await supabase.from("cart_items").select("product_id");
    const cartedIds = new Set((cartItems || []).map(c => c.product_id));
    console.log(`  Products in cart_items: ${cartedIds.size} unique IDs`);
    if (cartedIds.size > 0) console.log(`  IDs: ${[...cartedIds].join(", ")}`);

    // 5. Cross-reference: which test/dupe products are safe to delete?
    console.log("\n=== SAFE TO DELETE (test + not referenced) ===");
    const referencedIds = new Set([...orderedIds, ...cartedIds]);
    for (const tp of testProducts) {
        const safe = !referencedIds.has(tp.id);
        console.log(`  id=${tp.id}  name="${tp.name}"  safe=${safe}  ${safe ? "✓ CAN DELETE" : "✗ REFERENCED"}`);
    }

    for (const [name, rows] of dupes) {
        if (rows.length > 1) {
            // Keep the first one, check if others are safe
            for (let i = 1; i < rows.length; i++) {
                const safe = !referencedIds.has(rows[i].id);
                console.log(`  id=${rows[i].id}  name="${rows[i].name}" (duplicate of id=${rows[0].id})  safe=${safe}  ${safe ? "✓ CAN DELETE" : "✗ REFERENCED"}`);
            }
        }
    }

    // 6. Categories
    console.log("\n=== CATEGORIES ===");
    const { data: cats } = await supabase.from("categories").select("id, name").order("id");
    for (const c of cats) {
        const count = products.filter(p => p.category_id === c.id).length;
        console.log(`  id=${c.id}  name="${c.name}"  products=${count}`);
    }

    // 7. Products with low IDs (originals)
    console.log("\n=== ORIGINAL PRODUCTS (id < 100) ===");
    products.filter(p => p.id < 100).forEach(p => {
        console.log(`  id=${p.id}  name="${p.name}"  price=${p.price}  cat=${p.category_id}  ref=${referencedIds.has(p.id) ? "YES" : "no"}`);
    });
}

main().catch(err => { console.error(err); process.exit(1); });
