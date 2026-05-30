// apps/api/src/seed.ts
// This file is a development seed script. Skip TypeScript checks here to avoid
// type-resolution issues when run via node directly.
// @ts-nocheck
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/user.model';
import { Organization } from './models/organization.model';
import { Product } from './models/product.model';
import 'dotenv/config';

const SEED_DATA = [
    { city: "Indore", lng: 75.8577, lat: 22.7196, cat: "Dairy", prod: "Fresh Buffalo Milk", price: 60, unit: "Litre" },
    { city: "Bhopal", lng: 77.4126, lat: 23.2599, cat: "Spices", prod: "Organic Turmeric Powder", price: 180, unit: "kg" },
    { city: "Mumbai", lng: 72.8777, lat: 19.0760, cat: "Electronics", prod: "Wholesale USB Cables", price: 45, unit: "piece" },
    { city: "Delhi", lng: 77.1025, lat: 28.7041, cat: "Textiles", prod: "Cotton Fabric Rolls", price: 120, unit: "meter" },
    { city: "Bangalore", lng: 77.5946, lat: 12.9716, cat: "Beverages", prod: "Filter Coffee Beans", price: 450, unit: "kg" },
    { city: "Hyderabad", lng: 78.4867, lat: 17.3850, cat: "Grains", prod: "Biryani Basmati Rice", price: 95, unit: "kg" },
    { city: "Ahmedabad", lng: 72.5714, lat: 23.0225, cat: "Packaging", prod: "Corrugated Boxes", price: 12, unit: "piece" },
    { city: "Pune", lng: 73.8567, lat: 18.5204, cat: "Automotive", prod: "Engine Oil 4T", price: 320, unit: "Litre" },
    { city: "Chennai", lng: 80.2707, lat: 13.0827, cat: "Seafood", prod: "Dried Prawns Wholesale", price: 600, unit: "kg" },
    { city: "Kolkata", lng: 88.3639, lat: 22.5726, cat: "Stationery", prod: "A4 Paper Reams", price: 210, unit: "bundle" },
    { city: "Jaipur", lng: 75.7873, lat: 26.9124, cat: "Handicrafts", prod: "Blue Pottery Vases", price: 800, unit: "set" },
    { city: "Surat", lng: 72.8311, lat: 21.1702, cat: "Apparel", prod: "Saree Wholesale Bundle", price: 15000, unit: "bundle" },
    { city: "Lucknow", lng: 80.9462, lat: 26.8467, cat: "FMCG", prod: "Premium Mustard Oil", price: 145, unit: "Litre" },
    { city: "Nagpur", lng: 79.0882, lat: 21.1458, cat: "Fruits", prod: "Nagpur Oranges (Grade A)", price: 40, unit: "kg" },
    { city: "Patna", lng: 85.1376, lat: 25.5941, cat: "Hardware", prod: "Steel Door Hinges", price: 25, unit: "piece" },
    { city: "Nashik", lng: 73.7898, lat: 19.9975, cat: "Chemicals", prod: "Industrial Solvent", price: 85, unit: "Litre" },
    { city: "Agra", lng: 78.0081, lat: 27.1767, cat: "Footwear", prod: "Leather Formal Shoes", price: 1200, unit: "pair" },
    { city: "Ludhiana", lng: 75.8573, lat: 30.9010, cat: "Tools", prod: "Wrench Set (12 pcs)", price: 950, unit: "set" },
    { city: "Raipur", lng: 81.6296, lat: 21.2514, cat: "Steel", prod: "TMT Bars 12mm", price: 65, unit: "kg" },
    { city: "Rajkot", lng: 70.8022, lat: 22.3039, cat: "Machinery", prod: "Submersible Pump 1HP", price: 4500, unit: "unit" }
];

async function runSeed() {
    try {
        // Make sure this matches your MongoDB connection string in .env
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("🚀 Connected to MongoDB. Injecting 20 cities...");

        const hashedLabel = await bcrypt.hash("Password123!", 10);

        for (const item of SEED_DATA) {
            // 1. Create Organization
            const org = await Organization.create({
                legalName: `${item.city} Wholesale ${item.cat}`,
                orgType: 'seller',
                businessType: 'Wholesaler',
                location: {
                    type: "Point",
                    coordinates: [item.lng, item.lat]
                },
                verification: {
                    status: 'verified',
                    gstin: `27AAAAA0000A1Z${Math.floor(Math.random() * 9)}`
                },
                trustScore: 95,
                phone: "9123456780",
                email: `sales@${item.city.toLowerCase()}hub.com`
            });

            // 2. Create the User (Updated to match your model exactly)
            await User.create({
                email: `admin.${item.city.toLowerCase()}${Math.floor(Math.random() * 100)}@example.com`,
                passwordHash: hashedLabel, // ✅ Fixed: used passwordHash instead of password
                role: 'seller',
                organizationId: org._id,
                isProfileComplete: true,
                onboardingStep: 4 // ✅ Fixed: used Number instead of string "completed"
            });

            // 3. Create the Product
            await Product.create({
                name: item.prod,
                description: `Premium ${item.prod} bulk supply from ${item.city}. High stock availability for wholesale buyers.`,
                pricePerUnit: item.price,
                moq: 20,
                unit: item.unit,
                sellerId: org._id,
                location: org.location
            });

            console.log(`✅ Seeded: ${item.city} (${item.cat})`);
        }

        console.log("✨ SUCCESS: All 20 Indian cities are now live in your database!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    }
}

runSeed();