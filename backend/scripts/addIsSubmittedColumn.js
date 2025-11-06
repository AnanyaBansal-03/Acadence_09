const supabase = require("../db");

async function addIsSubmittedColumn() {
  console.log("🚀 Adding is_submitted column to attendance table...");

  try {
    // Add the column using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE attendance 
        ADD COLUMN IF NOT EXISTS is_submitted BOOLEAN DEFAULT false;
      `
    });

    if (error) {
      console.error("❌ Error adding column:", error);
      console.log("\n⚠️ Please run this SQL manually in Supabase SQL Editor:");
      console.log("\nALTER TABLE attendance ADD COLUMN IF NOT EXISTS is_submitted BOOLEAN DEFAULT false;");
      console.log("\nUPDATE attendance SET is_submitted = true WHERE is_submitted IS NULL;");
      return;
    }

    console.log("✅ Column added successfully!");

    // Update existing records to be submitted (so old data is visible)
    console.log("\n🔄 Updating existing attendance records...");
    
    const { data: updateData, error: updateError } = await supabase
      .from('attendance')
      .update({ is_submitted: true })
      .is('is_submitted', null);

    if (updateError) {
      console.error("❌ Error updating records:", updateError);
    } else {
      console.log("✅ Updated existing records to is_submitted = true");
    }

    // Verify the changes
    console.log("\n📊 Verifying...");
    const { count, error: countError } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('is_submitted', true);

    if (!countError) {
      console.log(`✅ Found ${count} submitted attendance records`);
    }

    console.log("\n✨ Migration completed successfully!");
    
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    console.log("\n⚠️ Please run this SQL manually in Supabase SQL Editor:");
    console.log("\nALTER TABLE attendance ADD COLUMN IF NOT EXISTS is_submitted BOOLEAN DEFAULT false;");
    console.log("\nUPDATE attendance SET is_submitted = true;");
  }
}

// Run the migration
addIsSubmittedColumn()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
