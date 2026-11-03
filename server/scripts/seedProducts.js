const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_KEY in server/.env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Category mapping helper
const DUMMY_CATEGORY_MAP = {
    // Electronics
    "smartphones": "Electronics",
    "laptops": "Electronics",
    "tablets": "Electronics",
    "mobile-accessories": "Electronics",

    // Fashion
    "mens-shirts": "Fashion",
    "mens-shoes": "Fashion",
    "womens-shoes": "Fashion",
    "tops": "Fashion",
    "womens-dresses": "Fashion",
    "womens-bags": "Fashion",
    "womens-jewellery": "Fashion",
    "mens-watches": "Fashion",
    "womens-watches": "Fashion",
    "sunglasses": "Fashion",

    // Home & Living
    "groceries": "Home & Living",
    "furniture": "Home & Living",
    "home-decoration": "Home & Living",
    "kitchen-accessories": "Home & Living",

    // Beauty
    "fragrances": "Beauty",
    "skin-care": "Beauty",
    "beauty": "Beauty",

    // Sports
    "sports-accessories": "Sports",
    "motorcycle": "Sports",
    "vehicle": "Sports",
    
    // Books
    "Books": "Books"
};

async function authenticate() {
    // If not using service role key, sign in with test admin credentials to satisfy RLS
    if (process.env.TEST_EMAIL && process.env.TEST_PASSWORD) {
        const { error } = await supabase.auth.signInWithPassword({
            email: process.env.TEST_EMAIL,
            password: process.env.TEST_PASSWORD
        });
        if (error) {
            console.warn("Admin sign-in note:", error.message);
        }
    }
}

async function clearRedisCache() {
    try {
        const { redis } = require("../redis");
        if (redis && !redis.isOpen) {
            await redis.connect().catch(() => {});
        }
        if (redis && redis.isOpen) {
            const keys = await redis.sMembers("product_cache_keys");
            if (keys && keys.length > 0) {
                await redis.del(keys);
                await redis.del("product_cache_keys");
            }
            await redis.disconnect().catch(() => {});
        }
    } catch {
        /* Redis is optional */
    }
}

async function main() {
    console.log("Fetching products...");

    await authenticate();

    // 1. Fetch DummyJSON products
    const res = await fetch("https://dummyjson.com/products?limit=0");
    if (!res.ok) {
        throw new Error(`Failed to fetch DummyJSON products: HTTP ${res.status}`);
    }
    const data = await res.json();
    const dummyProducts = data.products || [];
    console.log(`Fetched ${dummyProducts.length} products`);

    // 1b. Add sample Books (since DummyJSON lacks them)
    const sampleBooks = [
        { title: "Clean Architecture", description: "A Craftsman's Guide to Software Structure and Design.", price: 34.99, category: "Books", brand: "Prentice Hall", thumbnail: "https://m.media-amazon.com/images/I/41-sN-mzwKL.jpg", rating: 4.8 },
        { title: "The Pragmatic Programmer", description: "Your Journey To Mastery.", price: 42.00, category: "Books", brand: "Addison-Wesley", thumbnail: "https://m.media-amazon.com/images/I/51W1sBPO7tL._SX380_BO1,204,203,200_.jpg", rating: 4.9 },
        { title: "Design Patterns", description: "Elements of Reusable Object-Oriented Software.", price: 55.00, category: "Books", brand: "Addison-Wesley", thumbnail: "https://m.media-amazon.com/images/I/51szD9HC9pL._SX395_BO1,204,203,200_.jpg", rating: 4.7 },
        { title: "Cracking the Coding Interview", description: "189 Programming Questions and Solutions.", price: 39.95, category: "Books", brand: "CareerCup", thumbnail: "https://m.media-amazon.com/images/I/410hiaPGyCL._SX396_BO1,204,203,200_.jpg", rating: 4.7 },
        { title: "Grokking Algorithms", description: "An illustrated guide for programmers and other curious people.", price: 35.00, category: "Books", brand: "Manning", thumbnail: "https://m.media-amazon.com/images/I/61uUPXbhMxL._SX397_BO1,204,203,200_.jpg", rating: 4.8 },
        { title: "Refactoring", description: "Improving the Design of Existing Code.", price: 48.00, category: "Books", brand: "Addison-Wesley", thumbnail: "https://m.media-amazon.com/images/I/41OdMwTvsxL._SX397_BO1,204,203,200_.jpg", rating: 4.8 },
        { title: "Domain-Driven Design", description: "Tackling Complexity in the Heart of Software.", price: 54.99, category: "Books", brand: "Addison-Wesley", thumbnail: "https://m.media-amazon.com/images/I/51sZW87slRL._SX379_BO1,204,203,200_.jpg", rating: 4.6 },
        { title: "Introduction to Algorithms", description: "A comprehensive update of the leading algorithms text.", price: 85.00, category: "Books", brand: "MIT Press", thumbnail: "https://m.media-amazon.com/images/I/41SNoh5ZhOL._SX396_BO1,204,203,200_.jpg", rating: 4.6 },
        { title: "You Don't Know JS Yet", description: "Get Started.", price: 24.95, category: "Books", brand: "O'Reilly", thumbnail: "https://m.media-amazon.com/images/I/410mC9D2pSL._SX331_BO1,204,203,200_.jpg", rating: 4.7 },
        { title: "JavaScript: The Good Parts", description: "Unearthing the Excellence in JavaScript.", price: 29.99, category: "Books", brand: "O'Reilly", thumbnail: "https://m.media-amazon.com/images/I/5131OWtQRaL._SX381_BO1,204,203,200_.jpg", rating: 4.5 },
        { title: "Code Complete", description: "A Practical Handbook of Software Construction.", price: 45.00, category: "Books", brand: "Microsoft Press", thumbnail: "https://m.media-amazon.com/images/I/41JOMVWweGL._SX397_BO1,204,203,200_.jpg", rating: 4.7 },
        { title: "Structure and Interpretation of Computer Programs", description: "The definitive computer science text.", price: 65.00, category: "Books", brand: "MIT Press", thumbnail: "https://m.media-amazon.com/images/I/51w+zOQ-8TL._SX379_BO1,204,203,200_.jpg", rating: 4.8 },
        { title: "Eloquent JavaScript", description: "A Modern Introduction to Programming.", price: 39.95, category: "Books", brand: "No Starch Press", thumbnail: "https://m.media-amazon.com/images/I/51I9NA-SQ1L._SX377_BO1,204,203,200_.jpg", rating: 4.7 },
        { title: "The Mythical Man-Month", description: "Essays on Software Engineering.", price: 32.00, category: "Books", brand: "Addison-Wesley", thumbnail: "https://m.media-amazon.com/images/I/51N-D0nC-OL._SX322_BO1,204,203,200_.jpg", rating: 4.5 },
        { title: "Head First Design Patterns", description: "A Brain-Friendly Guide.", price: 49.99, category: "Books", brand: "O'Reilly", thumbnail: "https://m.media-amazon.com/images/I/51j8E44N3rL._SX379_BO1,204,203,200_.jpg", rating: 4.7 },
        { title: "Designing Data-Intensive Applications", description: "The Big Ideas Behind Reliable, Scalable, and Maintainable Systems.", price: 44.99, category: "Books", brand: "O'Reilly", thumbnail: "https://m.media-amazon.com/images/I/51ZSpMl1-lL._SX379_BO1,204,203,200_.jpg", rating: 4.8 }
    ];
    dummyProducts.push(...sampleBooks);

    // 2. Ensure Required Categories Exist and Fetch them
    const requiredCategories = ["Electronics", "Fashion", "Books", "Home & Living", "Beauty", "Sports"];
    const { data: currentCats } = await supabase.from("categories").select("id, name");
    const currentCatNames = (currentCats || []).map(c => c.name.toLowerCase());
    
    for (const reqCat of requiredCategories) {
        if (!currentCatNames.includes(reqCat.toLowerCase())) {
            console.log(`Inserting missing category: ${reqCat}`);
            await supabase.from("categories").insert([{ name: reqCat }]);
        }
    }

    const { data: dbCategories, error: catErr } = await supabase
        .from("categories")
        .select("id, name");

    if (catErr || !dbCategories || dbCategories.length === 0) {
        throw new Error("Could not fetch categories from Supabase: " + (catErr?.message || "No categories found"));
    }

    const categoryNameToId = {};
    for (const cat of dbCategories) {
        categoryNameToId[cat.name.toLowerCase().trim()] = cat.id;
    }

    // Resolve category id for each dummy category
    const mappedCategoriesCount = Object.keys(DUMMY_CATEGORY_MAP).length;
    console.log(`Mapped ${mappedCategoriesCount} categories`);

    // 3. Remove obvious old test products safely
    // Check if any order_items reference test products to avoid FK constraint violations
    let protectedIds = new Set();
    try {
        const { data: orderItems } = await supabase.from("order_items").select("product_id");
        if (orderItems) {
            orderItems.forEach(o => protectedIds.add(o.product_id));
        }
    } catch {
        /* ignore */
    }

    let removedCount = 0;
    try {
        let query = supabase
            .from("products")
            .delete()
            .ilike("name", "test product%");

        // Protect any rows referenced by order_items
        if (protectedIds.size > 0) {
            for (const pid of protectedIds) {
                query = query.neq("id", pid);
            }
        }

        const { data: deletedRows } = await query.select("id");
        removedCount = deletedRows ? deletedRows.length : 0;
    } catch {
        removedCount = 0;
    }
    console.log(`Removed ${removedCount} test products`);

    // 4. Fetch existing product names to avoid duplicates (by title)
    const { data: existingProducts, error: existErr } = await supabase
        .from("products")
        .select("id, name, category_id");

    if (existErr) {
        console.error("Error fetching existing products:", existErr.message);
        console.warn("Proceeding with empty duplicate set — all products will be treated as new");
    }

    const existingProductsMap = new Map();
    for (const p of existingProducts || []) {
        existingProductsMap.set((p.name || "").toLowerCase().trim(), p);
    }
    console.log(`Found ${existingProductsMap.size} unique existing product names in database (${(existingProducts || []).length} rows)`);

    // 5. Map, insert, and update products
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    const productsToInsert = [];
    const productsToUpdate = [];

    for (const p of dummyProducts) {
        const titleLower = (p.title || "").toLowerCase().trim();

        // Determine target category
        // The fallback "Home & Living" is used instead of "Home & Kitchen" since we mapped to it.
        const targetCategoryName = DUMMY_CATEGORY_MAP[p.category] || "Home & Living";
        const categoryId = categoryNameToId[targetCategoryName.toLowerCase()] || dbCategories[0].id;

        const existingProduct = existingProductsMap.get(titleLower);

        if (existingProduct) {
            // Check if category needs updating
            if (existingProduct.category_id !== categoryId) {
                productsToUpdate.push({
                    id: existingProduct.id,
                    category_id: categoryId
                });
            } else {
                skippedCount++;
                if (skippedCount <= 5) {
                    console.log(`  [skip] "${p.title}" (already correctly categorized)`);
                } else if (skippedCount === 6) {
                    console.log(`  [skip] ... (showing first 5 only)`);
                }
            }
            continue;
        }

        // Convert USD price to realistic INR pricing (~80 INR per USD, minimum 99)
        const inrPrice = Math.max(Math.round(p.price * 80), 99);

        productsToInsert.push({
            name: p.title.trim(),
            description: p.description || "",
            price: inrPrice,
            category_id: categoryId,
            brand: p.brand || "",
            image_url: p.thumbnail || (p.images && p.images[0]) || "",
            rating: p.rating || 0,
            discount_percentage: Math.round(p.discountPercentage || 0)
        });

        existingProductsMap.set(titleLower, { id: 'temp', category_id: categoryId });
    }
    console.log(`\nQueued ${productsToInsert.length} new products for insertion`);
    console.log(`Queued ${productsToUpdate.length} existing products for category update`);

    // Insert in batches of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
        const batch = productsToInsert.slice(i, i + BATCH_SIZE);
        const { data: insertedRows, error: insertErr } = await supabase
            .from("products")
            .insert(batch)
            .select("id");

        if (insertErr) {
            console.error(`Batch insert error at index ${i}:`, insertErr.message);
        } else if (insertedRows && insertedRows.length > 0) {
            insertedCount += insertedRows.length;
            
            // Insert default inventory for the new products
            const inventoryBatch = insertedRows.map(row => ({
                product_id: row.id,
                quantity: 50 // Default seed quantity
            }));
            
            const { error: invErr } = await supabase
                .from("inventory")
                .insert(inventoryBatch);
                
            if (invErr) {
                console.error(`Inventory insert error at index ${i}:`, invErr.message);
            }
        }
    }

    // Update existing products
    for (const update of productsToUpdate) {
        const { error: updateErr } = await supabase
            .from("products")
            .update({ category_id: update.category_id })
            .eq("id", update.id);
        
        if (updateErr) {
            console.error(`Error updating product ${update.id}:`, updateErr.message);
        } else {
            updatedCount++;
        }
    }

    console.log(`Inserted ${insertedCount} products`);
    console.log(`Updated ${updatedCount} products' categories`);
    console.log(`Skipped ${skippedCount} correctly categorized duplicates`);

    // 6. [REMOVED]
    
    // 7. Invalidate Redis cache
    await clearRedisCache();

    // 8. Print category breakdown
    console.log("\nProducts per category in Supabase:");
    for (const cat of dbCategories) {
        const { count } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("category_id", cat.id);
        console.log(`- ${cat.name}: ${count || 0} products`);
    }

    const { count: totalCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

    console.log(`Total products in database: ${totalCount || 0}`);
}

main().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
