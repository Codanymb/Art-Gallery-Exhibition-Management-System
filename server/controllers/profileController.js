const { db } = require("../database/db")

const viewProfile = (req, res) => {
    const user_id = req.user.id;

    const user_query = "SELECT * FROM USER_TABLE WHERE id = ?";

    db.get(user_query, [user_id], (err,user)=>{

        if(err){
            return res.json({"e1": err})
        }

        if (!user){
            return res.json({"message": "Something went wrong with the token"})
        }
        return res.json({"user": user})
    })
}

const updateProfile = (req, res) => {
    const user_id = req.user.id;
    const { name, surname, email, phone_number, address } = req.body;

    const update_query = `
        UPDATE USER_TABLE 
        SET name = ?, surname = ?, email = ?,  phone_number = ?, address = ?
        WHERE id = ? `;

    db.run(update_query, [name, surname, email, phone_number, address, user_id], function(err) {
        if (err) {
            return res.status(500).json({ msg: "Internal server error", error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ msg: "User not found or no changes made" });
        }

        res.json({ msg: "Profile updated successfully", status: true });
    });
};



module.exports = {
    viewProfile,updateProfile
}