const express = require('express')
const app = express()
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

const path = require('path')
const cookieParser = require('cookie-parser')

const userModel = require('./models/user')
const CategoryModel = require('./models/expense')

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname,'public')))
app.set('views',path.join(__dirname, 'views'))
app.set('view engine' ,'ejs')

app.use(cookieParser())

app.get('/',(req,res)=>{
    res.render('index')
})

app.post('/signup',async (req,res)=>{
    // console.log('signup chala')
    const {username, email, password, age }  = req.body
    // console.log(username,email,password,age)

    bcrypt.genSalt(10, (err, salt)=>{
         bcrypt.hash(password, salt, async (err, hash)=>{
           console.log('sasdhhs')
            let createUser = await userModel.create({
                username,
                email,
                password:hash,
                age
            })
            // console.log('ashgjagsdjasdjgasjg')

            let token = jwt.sign({email},"firoz")
            res.cookie('token',token)            
            res.send(createUser)
            console.log("user created successfully",createUser)
         })
    })
    
   
})

// create a login route for only show page 
app.get('/login',(req,res)=>{
    res.render('login')
 })

// create a login route to login user 
 app.post('/login', async (req,res)=>{
    let user = await userModel.findOne({email:req.body.email})
    if(!user){
        return res.send('Somthing went wrong')
    }

    bcrypt.compare(req.body.password, user.password, function(err, result){
        if(result){
            const token = jwt.sign({email:req.body.email}, 'secreetKey')
            res.cookie('token',token)
            res.send('yes you can login')
        }            
        else res.send('you cant not login')

    })
})

// clear cookies when we logout 
app.get('/logout', (req,res)=>{
    res.cookie('token', "")
    res.redirect('/')
})

app.post('/create-categories', async (req, res) => {
    const { name } = req.body;
    console.log("name",name)
    try {
        const category = new CategoryModel({ name, expenses: [] });
        await category.save();
        res.status(201).send(category);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.put('/update-categories/:categoryId', async (req, res) => {
    const { categoryId } = req.params;
    const { name } = req.body; 
    if (!name) {
        return res.status(400).send({ error: "Category name is required" });
    }

    try {
        const category = await CategoryModel.findById(categoryId);
        if (!category) {
            return res.status(404).send({ error: "Category not found" });
        }

        // Update the category name
        category.name = name;
        await category.save();

        res.status(200).send(category);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});


app.post('/categories/:categoryId/create-expenses', async (req, res) => {
    const { categoryId } = req.params;
    const { name, amount } = req.body;
      
    if (!name || !amount) {
        return res.status(400).send({ error: "Both 'name' and 'amount' are required" });
    }

    try {
        const category = await CategoryModel.findById(categoryId);
        if (!category) {
            return res.status(404).send({ error: "Category not found" });
        }

       // Add the expense
       const expense = { name, amount };
       category.expenses.push(expense);

       // Update the total amount
       category.totalAmount += parseFloat(amount);
        await category.save();

        res.status(201).send(category);
    } catch (error) {
        res.status(400).send({ error: error.message });
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
app.get('/specific-category/:categoryId', async (req, res) => {
    const { categoryId } = req.params;
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
app.delete('/delete-categories/:categoryId', async (req, res) => {
    const { categoryId } = req.params;
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

app.listen(2001)