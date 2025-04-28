const express = require('express');
const fs = require('fs');
const handlebars = require('handlebars'); 
const path = require('path');
const app = express();

const port = 3001;

// Give the pages access to files
app.use(express.static('public'));

// Compile the pages at server startup
const wordsPage = handlebars.compile(fs.readFileSync('templates/words.html', 'utf8'));
const suffixesPage = handlebars.compile(fs.readFileSync('templates/suffixes.html', 'utf8'));
const wordTemplate = handlebars.compile(fs.readFileSync('templates/word.html', 'utf8'));
const suffixTemplate = handlebars.compile(fs.readFileSync('templates/suffix.html', 'utf8'));

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});

// Words page
app.get('/words', (req, res) => {
    fs.readFile('words.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error reading word data.');
            return;
        }

        const words = JSON.parse(data);

        const groupedWords = {};
        words.forEach(word => {
            let translations;
            if(Array.isArray(word.translation)) {
                translations = word.translation;
            } else {
                translations = [word.translation];
            }

            translations.forEach((translation) => {
                const firstLetter = translation.charAt(0).toUpperCase();
                if (!groupedWords[firstLetter]) {
                    groupedWords[firstLetter] = []; // Create an array for this letter if it doesn't exist
                }
                groupedWords[firstLetter].push({...word, translation});
            })
        });

        // Alphabetical Sorting
        // Sort the keys, then for each key (A-Z) assign it to new obj
        const alphabetised = Object.keys(groupedWords).sort().reduce((
            (obj, key) => {
                // Sort each letter
                const sortedTranslations = groupedWords[key].sort((a, b) => a.translation.toLowerCase().localeCompare(b.translation.toLowerCase()));
                obj[key] = sortedTranslations;
                return obj;
            }),{}
        );

        const html = wordsPage({ groupedWords: alphabetised });
        res.send(html);
    });
});

// Individual word page
app.get('/words/:word', (req, res) => {
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

// Suffixes page
app.get('/suffixes', (req, res) => {
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

// Individual suffix page
app.get('/suffixes/:suffix', (req, res) => { 
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

// 404 page
app.get('/404', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, "/public/404.html")); // Send the 404.html file
});

// 404 redirect
app.use((req, res, next) => {
    res.redirect("/404")
});

// Listen for server requests
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
