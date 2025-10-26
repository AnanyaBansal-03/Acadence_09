const bcrypt = require("bcryptjs");
const supabase = require("../db"); // your supabase client

async function insertUsers() {
  try {
    const users = [
      { email: "yanasobti@gmail.com", password: "yana123", name: "yana", role: "admin" },
      { email: "ananyabansal3feb@gmail.com", password: "ananya123", name: "ananya", role: "admin" },
      { email: "kauransh2006@gmail.com", password: "ansh123", name: "ansh", role: "admin" }
    ];

    for (let user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            email: user.email,
            password: hashedPassword,
            name: user.name,
            role: user.role,
          },
        ]);

      if (error) {
        console.error(`❌ Error inserting ${user.email}:`, error.message);
      } else {
        console.log(`✅ Inserted user: ${user.email}`);
      }
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

insertUsers();