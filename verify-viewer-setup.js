import sql from './src/db/postgres.db.connection.js';

async function verifySetup() {
  try {
    // Check if track_viewers column exists
    const trackViewersCol = await sql`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'events' AND column_name = 'track_viewers'
    `;
    console.log('✅ track_viewers column:', trackViewersCol);

    // Check if event_viewers table exists
    const viewersTable = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'event_viewers'
    `;
    console.log('✅ event_viewers table exists:', viewersTable.length > 0);

    // Check views
    const views = await sql`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_name IN ('event_viewer_stats', 'event_top_viewers')
    `;
    console.log('✅ Viewer tracking views:', views.map(v => v.table_name));

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifySetup();
