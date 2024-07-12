const axios = require('axios');
const fs = require('fs');

const packageName = 'memvigil';
const url = `https://api.npmjs.org/downloads/point/2020-01-01:2030-01-01/${packageName}`;

axios.get(url)
    .then(response => {
        const downloads = response.data.downloads;
        const content = `# ${packageName} Downloads\n\nTotal downloads: ${downloads}\n`;
        fs.writeFileSync('downloads.md', content, 'utf8');
        console.log('Download data has been written to downloads.md');
    })
    .catch(error => {
        console.error(`Error fetching download data: ${error}`);
    });
