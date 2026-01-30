import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist');

function copyRecursiveSync(src, dest, exclude) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
            if (exclude && exclude.includes(childItemName)) return;
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        // Don't copy if it's the destination directory itself or its children
        if (dest.startsWith(src)) return;
        fs.copyFileSync(src, dest);
    }
}

async function organize() {
    if (!fs.existsSync(distPath)) {
        console.error('Error: dist directory not found. Run npm run build first.');
        process.exit(1);
    }

    console.log('🚀 Organizing build folders for subdomains...');
    const subdomains = ['creator', 'dev'];

    for (const sub of subdomains) {
        const targetPath = path.resolve(distPath, sub);

        // Clean target if exists
        if (fs.existsSync(targetPath)) {
            fs.rmSync(targetPath, { recursive: true, force: true });
        }

        console.log(`📂 Creating folder: dist/${sub}/`);

        // Copy everything from dist to dist/[sub]
        // But exclude the subdomain folders themselves to avoid infinite loops
        copyRecursiveSync(distPath, targetPath, subdomains);

        console.log(`✅ Build for ${sub} subdomain ready.`);
    }

    console.log('\n✨ All done! You can now upload the contents of the "dist" folder to your host\'s public_html.');
    console.log('   - heroestix.com -> dist/ (root contents)');
    console.log('   - creator.heroestix.com -> dist/creator/');
    console.log('   - dev.heroestix.com -> dist/dev/');
}

organize().catch(console.error);
