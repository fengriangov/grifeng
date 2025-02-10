const express = require('express');
const fs = require('fs');
const handlebars = require('handlebars'); 
const path = require('path');
const app = express();
const port = 8080;

// Give the pages access to files
app.use(express.static('public'));

// Compile the pages at server startup
const indexPage = handlebars.compile(fs.readFileSync('templates/index.html', 'utf8'));
const wordsPage = handlebars.compile(fs.readFileSync('templates/words.html', 'utf8'));
const suffixesPage = handlebars.compile(fs.readFileSync('templates/suffixes.html', 'utf8'));
const wordTemplate = handlebars.compile(fs.readFileSync('templates/word.html', 'utf8'));
const suffixTemplate = handlebars.compile(fs.readFileSync('templates/suffix.html', 'utf8'));

app.get('/', (req, res) => { // Home page
    const html = indexPage();
    res.send(html);
});

app.get('/words', (req, res) => { // Words page
    fs.readFile('words.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error reading word data.');
            return;
        }

        const words = JSON.parse(data);

        // words.forEach(word => {
        //     if (word.translation && word.translation.includes(',')) {
        //         word.translation = word.translation.split(',').map(t => t.trim());
        //     } else {
        //         word.translation = [word.translation];
        //     }
        // });

        // Sort words into alphabetically ordered groups
        const groupedWords = {};
        words.sort((a, b) => a.translation.toLowerCase().localeCompare(b.translation.toLowerCase()));
        words.forEach(word => {
            const firstLetter = word.translation.charAt(0).toUpperCase();
            if (!groupedWords[firstLetter]) {
                groupedWords[firstLetter] = []; // Create an array for this letter if it doesn't exist
            }
            groupedWords[firstLetter].push(word)
        });

        const html = wordsPage({ groupedWords: groupedWords })
        res.send(html);
    });
});

app.get('/words/:word', (req, res) => { // Individual word page
    fs.readFile('words.json', 'utf8', (err, data) => {
        if(err){
            console.error(err);
            res.status(500).send('Error reading word data.');
            return;
        }
  
        const words = JSON.parse(data);
        const word = words.find(w => w.word === req.params.word);
        if (!word) {
            res.redirect("/404");
            return;
        }

        const html = wordTemplate(word);
        res.send(html);
    });
});

app.get('/suffixes', (req, res) => { // Suffixes page
    fs.readFile('suffixes.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error reading suffix data.');
            return;
        }

        const suffixes = JSON.parse(data);
        suffixes.sort((a, b) => a.suffix.toLowerCase().localeCompare(b.suffix.toLowerCase()));
        const html = suffixesPage({ suffixes: suffixes });

        res.send(html)
    });
});

app.get('/suffixes/:suffix', (req, res) => { // Individual suffix page
    fs.readFile('suffixes.json', 'utf8', (err, data) => {
        if(err){
            console.error(err);
            res.status(500).send('Error reading suffix data.');
            return;
        }
  
        const suffixes = JSON.parse(data);
        const suffix = suffixes.find(s => s.suffix === req.params.suffix);
        if (!suffix) {
            res.redirect("/404");
            return;
        }

        const html = suffixTemplate(suffix);
        res.send(html);
    });
});

app.get('/404', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, "public", "404.html")); // Send the 404.html file
});

app.use((req, res, next) => {
    res.redirect("/404")
});

// Listen for server requests
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});