
const jwt = require("jsonwebtoken");

const User = require("../../../Models/user");
require("dotenv").config();

exports.AuthentificationUser = async (req, res) => {
  try {
    const bearer = req.headers["authorization"];
    const tab = bearer.split(" ");
    const token = tab[1];

    if (token === "null") {
      return res
        .status(401)
        .send({ msg: "ops passez au login pour se connecter !" });
    }

    jwt.verify(token, "1234", async (err, data) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
        
           res.status(410).send({ message: "session a expiré!" });
        } else {
          res.status(402).send({ msg: "ops session invalide !" });
        }
   
      } else {
       
        const user = await User.findOne({ email: data.email }); 
        if (user) {
          
          res.status(200).send({
            msg: "User Connected",
            user: {
              role:user.role,
              nom: user.firstname,
              prenom: user.lastname,
              email: user.email,
              Mobile: user.Mobile,
              image: user.image,
              _id: user._id,
              googleConnect:user.googleConnect
            },
          });
        }
        if (!user) {
          res.status(403).send({ msg: "User non trouvé dans db" });
        }
      }
    });
  } catch (error) {
    res.status(500).send({msg:"Erreur serveur",error});
  }
}

