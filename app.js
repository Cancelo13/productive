const express = require('express');
const app = express();
const path = require('path');

app.listen(3000);

// Get-Pages

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/goals', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'goals.html'));
});

app.get('/reports', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'reports.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'settings.html'));
});

app.get('/calendar', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'calendar.html'));
})

// Post-Pages

// Delete

// Redirect

// Error 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
})