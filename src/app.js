const express = require('express')
const app = express()
const {track} = require('./middleware/middleware')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const path = require('path')
const cookieParser = require('cookie-parser')

const userModel = require('./models/user')
const CategoryModel = require('./models/expense');

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname,'public')))
app.set('views',path.join(__dirname, 'views'))
app.set('view engine' ,'ejs')
app.use(cookieParser())

app.use(track('log.txt'))

// Middleware to authenticate user
const authenticateUser = (req, res, next) => {
    const token = req.cookies.token; 

    if (!token) {
        return res.status(401).send('Unauthorized: Please login first');
    }

    try {
        const decoded = jwt.verify(token, 'secreetKey'); // Replace 'secreetKey' with your secret key
        req.user = decoded; // Attach user data to the request object for further use
        next();
    } catch (err) {
        res.status(401).send('Unauthorized: Invalid or expired token');
    }
};

// app.use(authenticateUser);


app.get('/',(req,res)=>{
    res.render('index')
})

// Signup route
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            const createUser = await userModel.create({
                username,
                email,
                password: hash,
            });

            const token = jwt.sign({ email }, 'secreetKey');
            res.cookie('token', token);
            res.send(createUser);
        });
    });
});

// create a login route for only show page 
app.get('/login',(req,res)=>{
    res.render('login')
 })

// Login user route
app.post('/login', async (req, res) => {
    const user = await userModel.findOne({ email: req.body.email });
    if (!user) {
        return res.status(400).send('Something went wrong: User not found');
    }

    bcrypt.compare(req.body.password, user.password, function (err, result) {
        if (result) {
            const token = jwt.sign({ email: req.body.email }, 'secreetKey');
            res.cookie('token', token);
            res.send('Login successful');
        } else {
            res.status(400).send('Login failed: Invalid credentials');
        }
    });
});

// Logout route
app.get('/logout', (req, res) => {
    res.cookie('token', '', { maxAge: 0 }); // Clear the cookie by setting maxAge to 0
    res.send({message:"User logout successfully.."})
});

// CREATE A CATEGORY 
app.post('/create-categories', async (req, res) => {
    const { categoryName } = req.body;
    try {
        const category = new CategoryModel({ categoryName, expenses: [] });
        await category.save();
        res.status(201).send(category);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// UPDATE CATEGORY 
app.put('/update-categories', async (req, res) => {
    // const { categoryId } = req.params;
    const {categoryId, categoryName } = req.body; 

    if (!categoryId || !categoryName) {
        return res.status(400).send({ error: "Category ID & name is required" });
    }

    try {
        const category = await CategoryModel.findById(categoryId);
        if (!category) {
            return res.status(404).send({ error: "Category not found" });
        }

        // Update the category name
        category.categoryName = categoryName;
        await category.save();

        res.status(200).send(category);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// CREATE EXPENSE IN CATEGORY 
app.post('/create-expense', async (req, res) => {
    const {categoryId, expenseName, expenseAmount } = req.body; 

    if (!categoryId || !expenseName || !expenseAmount) {
        return res.status(400).send({ error: "Both 'name' and 'amount' are required" });
    }

    try {
        const category = await CategoryModel.findById(categoryId);
        if (!category) {
            return res.status(404).send({ error: "Category not found" });
        }

       // Add the expense
       const expense = { expenseName, expenseAmount };
       category.expenses.push(expense);

       // Update the total amount
       category.totalAmount += parseFloat(expenseAmount);
        await category.save();

        res.status(201).send(category);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// update expense 
app.put('/update-expense', async (req, res) => {
    const { categoryId, expenseId, expenseName, expenseAmount } = req.body;

    if (!categoryId || !expenseId) {
        return res.status(400).send({ error: "Both 'categoryId' and 'expenseId' are required" });
    }

    try {
        // Find the category
        const category = await CategoryModel.findById(categoryId);
        if (!category) {
            return res.status(404).send({ error: "Category not found" });
        }

        // Find the expense inside the category
        const expense = category.expenses.id(expenseId);
        if (!expense) {
            return res.status(404).send({ error: "Expense not found" });
        }

        // Update the expense fields
        if (expenseName) expense.expenseName = expenseName;
        if (expenseAmount !== undefined) {
            // Update the totalAmount by adjusting for the new amount
            category.totalAmount += parseFloat(expenseAmount) - parseFloat(expense.expenseAmount);
            expense.expenseAmount = parseFloat(expenseAmount);
        }

        await category.save();

        res.status(200).send({ message: "Expense updated successfully", category });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});


// 3. Get all categories with expenses
app.get('/all-categories', async (req, res) => {
    try {
        const categories = await CategoryModel.find();
        res.send(categories);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

//  Get a specific category with expenses
app.get('/specific-category', async (req, res) => {
    const { categoryId } = req.body;
    if(!categoryId){
        return res.status(400).send({error: 'Category id is compulsory'})
    }
    try {
        const category = await CategoryModel.findById(categoryId);
        if (!category) {
            return res.status(404).send({ error: "Category not found" });
        }
        res.send(category);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

//  Delete a specific category
app.delete('/delete-categories/', async (req, res) => {
    const { categoryId } = req.body;
    try {
        const category = await CategoryModel.findByIdAndDelete(categoryId);
        if (!category) {
            return res.status(404).send({ error: "Category not found" });
        }
        res.send({ message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT,console.log(`Server start... on port ${PORT}`))
