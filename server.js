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

/**
 * @typedef {object} WordEntry
 * @property {string} word - The word.
 * @property {string} pronunciation - The pronunciation of the word.
 * @property {string | string[]} translation - The translation of the word.
 * @property {string} grifengEx - An example sentence in Grifeng.
 * @property {string} englishEx - The English translation of the example sentence.
 */

/**
 * Same as WordEntry but with only a `string` translation
 * @typedef {object} ResolvedEntry
 * @property {string} word
 * @property {string} pronunciation
 * @property {string} translation
 * @property {string} grifengEx
 * @property {string} englishEx
 */

/**
 * @typedef {Object.<string,ResolvedEntry[]>} WordGroups
 */

app.get('/words', (req, res) => { // Words page
    fs.readFile('words.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error reading word data.');
            return;
        }

        /**@type {WordEntry[]} */
        const words = JSON.parse(data);

        /**@type {WordGroups} */
        const groupedWords = {};

        words.forEach(word => {
            /** @type {string[]} */
            let translations;
            if(Array.isArray(word.translation)) {
                translations = word.translation
            } else {
                translations = [word.translation]
            }

            translations.forEach((translation) => {
            const firstLetter = translation.charAt(0).toUpperCase();
            if (!groupedWords[firstLetter]) {
                groupedWords[firstLetter] = []; // Create an array for this letter if it doesn't exist
            }
            groupedWords[firstLetter].push({...word, translation})
            })
        });

        // Now alphabetise
        // Sort the keys, then for each key (A-Z) assign it to new obj
        // That then gets returned into alphabetised
        const alphabetised = Object.keys(groupedWords).sort().reduce((
            (obj, key) => {
                // Sort each letter too :)
                const sortedTranslations = groupedWords[key].sort((a, b) => wordSort(a.translation, b.translation))
                obj[key] = sortedTranslations
                return obj
            }
        ),{})

        const html = wordsPage({ groupedWords: alphabetised })
        res.send(html);
    });
});

/**
 * Locale-sorts strings
 * @param {string} first
 * @param {string} second
 */
function wordSort(first, second){
    return first.toLowerCase().localeCompare(second.toLowerCase())
}

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