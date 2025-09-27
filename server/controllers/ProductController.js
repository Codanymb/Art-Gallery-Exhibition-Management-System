const sha256 = require ("sha256");
const jwt = require ("jsonwebtoken");
const {db}= require("../database/db");
const bodyParser = require ("body-parser");

const AddProducts = async (req, res) => {
    const{product_name, product_description,stock_level, Image, Price} = req.body;

    const add_qury = "INSERT INTO Products (product_name, product_description,stock_level, Image, Price) VALUES (?,?,?,?, ?)";
    db.run(add_qury, [product_name, product_description,stock_level, Image, Price], function(err){
        if(err){
            console.error('Error inserting product: ', err.message)
            return res.status(500).json({"msg" : "Internal server error", "status": false});
        }
        res.status(201).json({"message": "SUCCESSFULLY ADDDED THE PRODUCT", "status": true});

    })
        };

        process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});

const updateProduct =async (req, res) => {
    const product_id = req.params.product_id;
    const{product_name, product_description, stock_level, Image, Price} = req.body;

    //  console.log("Updating component ID:", component_id);
    // console.log("New data:", { component_name,  component_description, stock_level });

    const update_quey = 'UPDATE Products SET product_name=?, product_description=?, stock_level =?, Image=?,Price=? WHERE product_id =?';

    db.run(update_quey, [product_name,product_description,stock_level, Image,Price, product_id], function(err){
        if(err){
            return res.status(500).json({msg: "Internal server error", error: err.message});
        }

        if(this.changes === 0){
            return res.status(404).json({msg: "No product found / no changes made"});
        }
        res.json({msg: "Successfully updated the product", status:true});
    })
}

const deleteProduct = (req,res) => {
    const product_id = req.params.product_id;

    const deleteQuery = "DELETE FROM Products WHERE product_id=?";

    db.run(deleteQuery, [product_id], function(err){

      if(err){
        return res.status(500).json({error: "Failed to delete", details: err.message});
      }

      if(this.changes===0){
        return res.status(404).json({message: "Product not found"})
      }

      return res.status(200).json({message: "Product Deleted!"})
    })
}

const getAllProducts = (req, res) => {
    const getQuery =  'SELECT * FROM Products';
    db.all(getQuery, [], (err, rows) => {
        if(err){
            return res.status(500).json({err: "Failed to get all the products", details: err.message})
        };
        return res.status(200).json({products: rows})
    })
    
}

const getEachProduct = (req, res) => {
    const product_id = req.params.product_id;

    const getQuery = "SELECT * FROM Products WHERE product_id = ?"

    db.get(getQuery, [product_id], (err, products) =>{
        if(err){
            return res.json({"e1": err})
        }
        if(!products){
            return res.json({"message": "no product found"})
        }
        return res.json({"Product": products})
    })
}



    module.exports ={
          AddProducts,updateProduct, deleteProduct, getAllProducts,getEachProduct
    }
      
    

