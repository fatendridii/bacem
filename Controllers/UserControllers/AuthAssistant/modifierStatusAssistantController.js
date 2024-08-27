const bcrypt = require("bcrypt");
const dotenv = require('dotenv');
dotenv.config();
const User = require('../../../Models/user');
const sendEmail = require("../../../EmailSend/mailer");

exports.update = async (req, res) => {
    const { email, newStatus } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        const { firstname, lastname, password, status } = user;
        
        if (newStatus) {
            user.status = newStatus;
        }
        await user.save();
        if (newStatus === 'active') {
            await sendEmail({
                from: process.env.EMAIL_ADDRESS,
                to: email,
                subject: "Votre demande a été acceptée",
                html: `
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td align="center" valign="top" style="background-color: #838383;"><br><br>
                            <table width="600" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" valign="top" bgcolor="#d3be6c" style="background-color: beige; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #000000; padding: 0px 15px 10px 15px;">
                                        <div style="font-size: 38px; color:#ff8000;">
                                            <br>
                                            <p>أرزاق</p>
                                        </div>
                                        <div style="font-size: 20px; color: black;">
                                            Bonjour ${firstname} ${lastname},<br>
                                            Votre demande a été acceptée. <br>
                                        </div>
                                        <div style="color: black;">
                                            <br> <b>Vous pouvez vous connecter à notre plateforme avec :</b><br>
                                            <span><b>Email:</b></span> <span>${email}</span><br>
                                            Cordialement,<br><br>
                                            Arzaak <br>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    </table>
                `
            });
        }
        return res.status(200).json({ message: "Statut de l'utilisateur mis à jour avec succès", user });
    } catch (error) {
        console.error("Erreur lors de la mise à jour du statut de l'utilisateur :", error);
        return res.status(500).json({ message: "Erreur lors de la mise à jour du statut de l'utilisateur" });
    }
};
