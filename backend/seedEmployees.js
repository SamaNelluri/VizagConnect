const mongoose = require('mongoose');
const Employee = require('./models/Employee'); // adjust path if needed

const employees = [
  { unit: "VIIT", firstName: "Rajesh", email: "annikallanandhini03@gmail.com" },
  { unit: "VIEW", firstName: "Sunita", email: "sunita.principal@view.edu" },
  { unit: "VIPT", firstName: "Manoj", email: "manoj.principal@vipt.edu" },
  { unit: "WoS", firstName: "Anita", email: "anita.principal@wos.edu" },
  { unit: "VSCPS", firstName: "Prakash",  email: "prakash.principal@vscps.edu" },
  { unit: "City Office", firstName: "Suresh", email: "suresh.garu@cityoffice.gov" }
];

mongoose.connect('mongodb+srv://nandhiniannikalla322005:ius3b1DqJo3XnePQ@cluster0.gpzk2sp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to DB');
    // Clear existing employees (optional)
    await Employee.deleteMany({});

    // Insert seed data
    await Employee.insertMany(employees);
    console.log('Employees added successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('DB connection error:', err);
    process.exit(1);
  });
