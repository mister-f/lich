/*
 * Name: index.js
 * Date: 04-25-19
 * Description: Team Lich Express backend setup file.
 */

const cool = require('cool-ascii-faces')
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

express()
	.use(express.static(path.join(__dirname, 'public')))
	.set('views', path.join(__dirname, 'views'))
	.set('view engine', 'handlebars')
	.get('/', (req, res) => res.render('pages/index'))
	.get('/cool', (req, res) => res.send(cool()))
	.listen(PORT, () => console.log(`Listening on ${ PORT }`))
