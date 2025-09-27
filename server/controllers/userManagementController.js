const { db } = require("../database/db")

const deleteAccount = (req, res) => {
    const userId = req.user.id;

    const deleteQuery = "DELETE FROM USER_TABLE WHERE id = ?";

    db.run(deleteQuery, [userId], function (err) {
    if (err) {
      return res.status(500).json({ error: "Deletion failed", details: err.message });
    }

    if (this.changes === 0) { //no user found
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Account deleted successfully" });
  });
};

const getAllUser = (req,res) => {

    if(req.user.user_type !== "Admin"){
        return res.status(403).json({message: "only Admins have access"});
    }
    const userQuery = "SELECT name, surname , email FROM USER_TABLE";
    db.all(userQuery, [], (err,rows) => {
        if (err){
            return res.status(500).json({ error: "Getting all the user failed", details: err.message})
        };
        return res.status(200).json({ users: rows})
    })
}

module.exports = {
  deleteAccount, getAllUser
}