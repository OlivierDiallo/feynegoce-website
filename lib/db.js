'use strict';
const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function filePath(file) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const fp = path.join(DATA_DIR, file);
  if (!fs.existsSync(fp)) fs.writeFileSync(fp, '[]');
  return fp;
}

function read(file) {
  try { return JSON.parse(fs.readFileSync(filePath(file), 'utf8')); }
  catch { return []; }
}

function write(file, data) {
  fs.writeFileSync(filePath(file), JSON.stringify(data, null, 2));
}

function nextId(file) {
  const items = read(file);
  if (items.length === 0) return 1;
  return Math.max(...items.map(i => Number(i.id) || 0)) + 1;
}

const db = {
  find(file, predicate) {
    return read(file).filter(predicate || (() => true));
  },

  findOne(file, predicate) {
    return read(file).find(predicate) || null;
  },

  insert(file, doc) {
    const items = read(file);
    const item  = { id: nextId(file), createdAt: new Date().toISOString(), ...doc };
    items.push(item);
    write(file, items);
    return item;
  },

  update(file, id, updates) {
    const items = read(file);
    const idx   = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    write(file, items);
    return items[idx];
  },

  remove(file, id) {
    const items    = read(file);
    const filtered = items.filter(i => i.id !== id);
    write(file, filtered);
    return filtered.length < items.length;
  },

  seedAdmin() {
    const users = read('users.json');
    if (users.length === 0) {
      const bcrypt = require('bcryptjs');
      const admin  = {
        id:        1,
        name:      'Admin',
        email:     'admin@feynegoce.com',
        password:  bcrypt.hashSync('FeyneAdmin2024!', 10),
        role:      'admin',
        share:     34, // owner's share of profits
        createdAt: new Date().toISOString()
      };
      write('users.json', [admin]);
      console.log('[DB] Default admin: admin@feynegoce.com / FeyneAdmin2024!');
    }
  }
};

module.exports = db;
