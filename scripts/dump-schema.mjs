// Quick script to dump the current Supabase database schema
// Usage: node scripts/dump-schema.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Read .env.local
const envPath = resolve(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = Object.fromEntries(
    envContent.split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => {
            const [key, ...rest] = line.split('=')
            return [key.trim(), rest.join('=').trim()]
        })
)

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Discover tables by probing known + likely table names
const knownTables = [
    'profiles', 'courses', 'enrollments', 'materials', 'assignments',
    'submissions', 'announcements', 'course_embeddings', 'chat_histories',
    'discussions', 'discussion_posts', 'discussion_replies', 'forums',
    'timetables', 'online_classes', 'notifications', 'grades', 'users'
]

console.log('=== SUPABASE SCHEMA DUMP ===\n')

for (const table of knownTables) {
    const { data: sample, error } = await supabase.from(table).select('*').limit(1)
    if (!error) {
        console.log(`📋 TABLE: ${table}`)
        if (sample && sample.length > 0) {
            const columns = Object.entries(sample[0]).map(([key, val]) => {
                const type = val === null ? 'unknown' : typeof val
                return `   - ${key} (${type}): ${JSON.stringify(val)?.substring(0, 80)}`
            })
            console.log(columns.join('\n'))
        } else {
            console.log('   (empty table — columns unknown without data)')
        }
        console.log()
    }
}

console.log('=== DONE ===')
