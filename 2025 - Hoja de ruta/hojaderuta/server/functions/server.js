// server/functions/server.js
const express = require('express');
const serverless = require('serverless-http');
const app = require('../server'); // Importa tu aplicación Express

// Exporta la aplicación como una función serverless
module.exports.handler = serverless(app);