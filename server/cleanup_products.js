/**
 * CartScale Product Cleanup Script
 * 
 * This script:
 * 1. Lists all products and identifies test/demo products
 * 2. Identifies exact duplicate products (same name, price, category_id)
 * 3. Checks if any test/duplicate products are referenced by cart_items, order_items, or inventory
 * 4. Only deletes products that are safe to remove (not referenced)
 * 
 * Run from the server directory with: node ../scratch/cleanup_products.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY
);

async function main() {
    console.log("=== CartScale Product Cleanup ===\n");

    // 1. Get all products
    const { data: allProducts, error } = await supabase
        .from("products")
        .select("id, name, price, category_id, description, created_at")
        .order("id");

    if (error) {
        console.error("Failed to fetch products:", error.message);
        process.exit(1);
    }

    console.log(`Total products in database: ${allProducts.length}\n`);

    // 2. Identify test products
    const testPatterns = [
        /^test product/i,
        /^test item/i,
        /^sample product/i,
        /^demo product/i,
        /^dummy product/i,
        /^test$/i,
    ];

    const testProducts = allProducts.filter(p => 
        testPatterns.some(pattern => pattern.test(p.name?.trim()))
    );

    console.log("--- TEST PRODUCTS FOUND ---");
    if (testProducts.length === 0) {
        console.log("No test products found.");
    } else {
        testProducts.forEach(p => {
            console.log(`  ID: ${p.id} | Name: "${p.name}" | Price: ${p.price} | Category: ${p.category_id}`);
        });
    }
    console.log();

    // 3. Identify exact duplicates (same name, price, category_id)
    const productKey = (p) => `${(p.name || '').toLowerCase().trim()}|${p.price}|${p.category_id}`;
    const groups = {};
    allProducts.forEach(p => {
        const key = productKey(p);
        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
    });

    const duplicateGroups = Object.entries(groups).filter(([, items]) => items.length > 1);

    console.log("--- EXACT DUPLICATE GROUPS (same name, price, category) ---");
    if (duplicateGroups.length === 0) {
        console.log("No exact duplicate groups found.");
    } else {
        duplicateGroups.forEach(([key, items]) => {
            console.log(`  Group "${key}":`);
            items.forEach(p => {
                console.log(`    ID: ${p.id} | Name: "${p.name}" | Created: ${p.created_at}`);
            });
        });
    }
    console.log();

    // 4. Collect IDs to potentially delete
    const toDeleteIds = new Set();

    // Add all test products
    testProducts.forEach(p => toDeleteIds.add(p.id));

    // For duplicates, keep the one with the lowest ID (oldest), mark rest for deletion
    duplicateGroups.forEach(([, items]) => {
        const sorted = [...items].sort((a, b) => a.id - b.id);
        for (let i = 1; i < sorted.length; i++) {
            toDeleteIds.add(sorted[i].id);
        }
    });

    if (toDeleteIds.size === 0) {
        console.log("Nothing to clean up!");
        return;
    }

    console.log(`--- CANDIDATES FOR DELETION (${toDeleteIds.size} products) ---`);
    const deleteIds = Array.from(toDeleteIds);
    deleteIds.forEach(id => {
        const p = allProducts.find(x => x.id === id);
        console.log(`  ID: ${id} | Name: "${p?.name}"`);
    });
    console.log();

    // 5. Check foreign key references
    console.log("--- CHECKING REFERENCES ---");

    const { data: cartRefs } = await supabase
        .from("cart_items")
        .select("product_id")
        .in("product_id", deleteIds);

    const cartRefIds = new Set((cartRefs || []).map(r => r.product_id));

    const { data: orderRefs } = await supabase
        .from("order_items")
        .select("product_id")
        .in("product_id", deleteIds);

    const orderRefIds = new Set((orderRefs || []).map(r => r.product_id));

    const { data: inventoryRefs } = await supabase
        .from("inventory")
        .select("product_id")
        .in("product_id", deleteIds);

    const inventoryRefIds = new Set((inventoryRefs || []).map(r => r.product_id));

    const referencedIds = new Set([...cartRefIds, ...orderRefIds, ...inventoryRefIds]);

    if (referencedIds.size > 0) {
        console.log("Referenced products (WILL NOT DELETE):");
        referencedIds.forEach(id => {
            const p = allProducts.find(x => x.id === id);
            const refs = [];
            if (cartRefIds.has(id)) refs.push("cart_items");
            if (orderRefIds.has(id)) refs.push("order_items");
            if (inventoryRefIds.has(id)) refs.push("inventory");
            console.log(`  ID: ${id} | Name: "${p?.name}" | Referenced in: ${refs.join(", ")}`);
        });
    } else {
        console.log("No candidates are referenced by carts, orders, or inventory.");
    }
    console.log();

    // 6. Safe to delete
    const safeToDelete = deleteIds.filter(id => !referencedIds.has(id));

    if (safeToDelete.length === 0) {
        console.log("No products are safe to delete (all are referenced).");
        return;
    }

    console.log(`--- DELETING ${safeToDelete.length} PRODUCTS ---`);
    safeToDelete.forEach(id => {
        const p = allProducts.find(x => x.id === id);
        console.log(`  Deleting ID: ${id} | Name: "${p?.name}"`);
    });

    // Delete inventory entries first (safety, even though CASCADE should handle it)
    const { error: invDelError } = await supabase
        .from("inventory")
        .delete()
        .in("product_id", safeToDelete);
    
    if (invDelError) {
        console.error("Warning: Could not delete inventory entries:", invDelError.message);
    }

    // Delete the products
    const { data: deleted, error: delError } = await supabase
        .from("products")
        .delete()
        .in("id", safeToDelete)
        .select("id, name");

    if (delError) {
        console.error("Failed to delete products:", delError.message);
    } else {
        console.log(`\nSuccessfully deleted ${deleted.length} product(s).`);
        deleted.forEach(p => console.log(`  Deleted: ID ${p.id} - "${p.name}"`));
    }

    // 7. Final count
    const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true });

    console.log(`\nFinal product count: ${count}`);
}

main().catch(console.error);
