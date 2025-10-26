const supabase = require('./db');

async function removeDuplicates() {
  try {
    console.log('Removing duplicate attendance records for student 3...\n');

    // Get all attendance for student 3
    const { data: allRecords } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', 3)
      .order('created_at', { ascending: false });

    if (!allRecords || allRecords.length === 0) {
      console.log('No records found for student 3');
      return;
    }

    console.log(`Found ${allRecords.length} total attendance records for student 3`);

    // Group by class_id and date, keep only the latest one
    const recordsByDateAndClass = {};
    
    allRecords.forEach(record => {
      const dateOnly = new Date(record.date).toISOString().split('T')[0];
      const key = `${record.class_id}_${dateOnly}`;
      
      if (!recordsByDateAndClass[key]) {
        recordsByDateAndClass[key] = [];
      }
      recordsByDateAndClass[key].push(record);
    });

    console.log(`\nGrouped into ${Object.keys(recordsByDateAndClass).length} unique date/class combinations`);

    // Find records to delete (keep only one per date/class)
    const recordsToDelete = [];
    const recordsToKeep = [];

    for (const [key, records] of Object.entries(recordsByDateAndClass)) {
      if (records.length > 1) {
        // Keep the first one (latest by created_at)
        recordsToKeep.push(records[0]);
        // Delete the rest
        recordsToDelete.push(...records.slice(1));
      } else {
        recordsToKeep.push(records[0]);
      }
    }

    console.log(`\nKeeping: ${recordsToKeep.length} records`);
    console.log(`Deleting: ${recordsToDelete.length} duplicate records`);

    if (recordsToDelete.length > 0) {
      const deleteIds = recordsToDelete.map(r => r.id);
      
      for (const id of deleteIds) {
        const { error } = await supabase
          .from('attendance')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error(`Error deleting record ${id}:`, error);
        } else {
          console.log(`✓ Deleted record ${id}`);
        }
      }

      console.log(`\n✅ Deleted ${recordsToDelete.length} duplicate records`);
    } else {
      console.log('\nNo duplicates found - all records are unique');
    }

    // Show final summary
    const { data: remaining } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', 3);

    console.log(`\nFinal attendance records for student 3: ${remaining?.length || 0}`);

  } catch (err) {
    console.error('Error:', err);
  }
}

removeDuplicates();
