const fs = require('fs');
const puppeteer = require('puppeteer');

// Insert li_at cookie here in '' 
const LINKEDIN_COOKIE = process.env.LINKEDIN_COOKIE || '';
if (!LINKEDIN_COOKIE) {
    console.error('❌ LinkedIn authentication required!');
    console.error('\n📋 Quick Setup Guide:');
    console.error('   1. Log into LinkedIn in your browser');
    console.error('   2. Open Developer Tools (F12)');
    console.error('   3. Go to Application/Storage > Cookies > linkedin.com');
    console.error('   4. Copy the "li_at" cookie value');
    console.error('   5. Set environment variable: export LINKEDIN_COOKIE="your_cookie_value"');
    console.error('\n💡 Need help? Check the README for detailed instructions.');
    process.exit(1);
}

function slugify(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
        .replace(/\s+/g, '-');
}

// Add this function after findCompanyId
async function writeResults(results) {
    const outputPath = 'company_ids.txt';
    const content = results
        .filter(r => r.id) // Only include entries with IDs
        .map(r => `${r.name} ${r.id}`)
        .join('\n');
    
    fs.writeFileSync(outputPath, content);
    console.log(`\nResults written to ${outputPath}`);
}

async function findCompanyId(url) {
    const browser = await puppeteer.launch({ 
        headless: true,
        dumpio: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Add LinkedIn authentication
    await page.setCookie({
        name: 'li_at',
        value: LINKEDIN_COOKIE,
        domain: '.linkedin.com',
        path: '/',
    });

    try {
        console.log('Navigating to:', url);
        await page.goto(url, { waitUntil: 'networkidle2' });
        console.log('Page loaded, waiting for content...');
        await new Promise(resolve => setTimeout(resolve, 5000));  // Increased wait time

        // Enable console logging from the page
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));

        const result = await page.evaluate(() => {
            console.log('Starting page evaluation...');
            const links = Array.from(document.querySelectorAll('a'));
            console.log(`Found ${links.length} links on page`);
            
            // Log all link texts for debugging
            links.forEach((link, index) => {
                console.log(`Link ${index}:`, {
                    text: link.innerText.trim(),
                    href: link.href,
                    classes: link.className
                });
            });

            // Try to find the specific employee count link
            const employeeLink = links.find(link => {
                const hasEmployees = link.innerText.toLowerCase().includes('employee');
                const hasCurrentCompany = link.href.includes('currentCompany');
                console.log('Checking link:', {
                    text: link.innerText,
                    hasEmployees,
                    hasCurrentCompany
                });
                return hasEmployees && hasCurrentCompany;
            });

            if (employeeLink) {
                console.log('Found employee link:', employeeLink.href);
                const match = employeeLink.href.match(/currentCompany=%5B%22(\d+)%22%5D/);
                console.log('Regex match result:', match);
                if (match && match[1]) {
                    return `Company ID found: ${match[1]}`;
                }
            }
            
            console.log('No matching employee link found');
            return "Company ID not found";
        });

        return result;
    } catch (err) {
        console.error(`⚠️  Issue with ${url}:`, err.message);
        if (err.message.includes('net::ERR_INTERNET_DISCONNECTED')) {
            console.error('   💡 Check your internet connection and try again');
        } else if (err.message.includes('Timeout')) {
            console.error('   💡 LinkedIn may be slow - this is normal, continuing...');
        } else if (err.message.includes('blocked')) {
            console.error('   💡 Rate limited - consider adding delays between requests');
        }
        return `Error processing ${url}: ${err.message}`;
    } finally {
        await browser.close();
    }
}


async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('❌ Missing input file!');
        console.error('\n📖 Usage: node idfinder.js <path to file with company names>');
        console.error('\n📝 Example:');
        console.error('   node idfinder.js companies.txt');
        console.error('\n📋 Input file format:');
        console.error('   • One company name per line');
        console.error('   • Example: "Microsoft\\nGoogle\\nApple"');
        console.error('\n💡 Tip: Make sure your file exists and contains company names!');
        process.exit(1);
    }
    
    const data = fs.readFileSync(filePath, 'utf-8');
    const companyNames = data.split(/\r?\n/).filter(line => line.trim() !== '');
    const results = [];
    
    for (let name of companyNames) {
        const slug = slugify(name);
        const url = `https://www.linkedin.com/company/${slug}`;
        console.log(`Processing: ${name} => ${url}`);
        const result = await findCompanyId(url);
        
        // Extract ID from the result string
        const idMatch = result.match(/Company ID found: (\d+)/);
        results.push({
            name: name,
            id: idMatch ? idMatch[1] : null
        });
    }
    
    await writeResults(results);
}

main();