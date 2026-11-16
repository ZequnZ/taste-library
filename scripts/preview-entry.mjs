import collection from '../collection.json' with { type: 'json' };
import { escapeHtml, entryUrl, icon } from './navigation.js';
const entry = collection.entries.find(item => item.reaction?.includes('wants to add'));
