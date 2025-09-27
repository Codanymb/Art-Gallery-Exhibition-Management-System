const sha256 = require ("sha256");
const jwt = require ("jsonwebtoken");
const passwordValidator = require ("password-validator");
const emailValidator = require("email-validator");
const {db} = require ("../database/db");
const bodyParser = require("body-parser");


const password_validator = (password) => {
    const schema = new passwordValidator();

    const pass_schema = schema
    .is().min(5)
    .has().uppercase()
    .has().lowercase()

    return pass_schema.validate(password, {details: true});

};

const register = async (req, res) => {
    const {name, surname,email, user_type, phone_number,address, password} = req.body;

    if(password_validator(password).length > 0){
        return res.status(400).json({"msg": password_validator(password), "status": false});
    }

    if(!emailValidator.validate(email)){
        return res.status(400).json({"msg": "Incorrect email format", "status": false});
    }

    const hashedPass = sha256 (password);
    const user_query = "SELECT * from USER_TABLE where email = ?"

    //Checking if the user already exist
    db.get(user_query, [email], (err, user) => {

        if(err){
            console.error('Error', err.message);
            return res.status(500).json({"msg": "Internal server error", "status": false});
        }

        if(user){
            return res.status(400).json({"msg": "User already Exist!!!", "status": false})
        }

        const user_type = "Customer";
  
    const add_query = "INSERT INTO USER_TABLE (name, surname,email, user_type,phone_number,address, password) VALUES (?, ?, ?,?, ?, ?, ?)";
    db.run(add_query, [name, surname,email, user_type,phone_number,address, hashedPass], function (err){
        if(err){
            console.error('Error inserting data:', err.message)
            return res.status(500).json({"msg": "Interneal server error", "status":false});
        }
        res.status(200).json({"message": "USER CREATION SUCCESS", "status":true});
    });
});
};


const login = (req, res) => {
    const {email,password} = req.body;
    
    const user_query = "SELECT * FROM USER_TABLE Where email = ?";

    db.get(user_query, [email], (err,user) =>{
        console.log("The user is: ", user)

        if(user){
            const real_pass = sha256(password);

            if(real_pass === user.password){
                const payload = {id: user.id, user_type:user.user_type};
                console.log("Payload: ",payload);

                const token= jwt.sign(payload, "private_key");
                console.log("Token: ", token);

                const decoded = jwt.decode(token);
                console.log("Decoded Token", decoded);
                
               return res.status(200).json({
                status: true,
                 message: "Successfully logged in",
                 token, 
                 payload,
});


            }
            else{
                return res.json("Wrong credentials");
            }
        }
        else {
            return res.json("Wrong credentials");
        }
    })
}


process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});

module.exports = {
    register, login

};