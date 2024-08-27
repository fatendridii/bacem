const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const Certificate = require('../../Models/certificate'); 
const User = require('../../Models/user'); 
const Quiz = require('../../Models/quizzes/quiz'); 
const path = require('path');
const QRCode = require('qrcode');
const sendEmail = require("../../EmailSend/mailer");

const generatePdf = async (userName, quizTitle, date, qrCodeUrl) => {
   
  
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificat de Réussite</title>
        <style>
            body {
                font-family: 'Times New Roman', Times, serif;
                text-align: center;
                margin: 0;
                padding: 0;
                background-color: #f9f9f9;
            }
            .certificate-outer-container {
                border: 4px solid #000;
                padding: 10px;
                width: 90%;
                margin: 10px auto;
                background-color: #fff;
                position: relative;
               
            }
            .certificate-inner-container {
                border: 2px solid #000;
                padding: 5px;
                background-color: #fff;
                
            }
            .certificate-header {
                font-size: 38px;
                font-family: 'Brush Script MT', cursive;
                margin-bottom: 20px;
            }
            .certificate-subheader {
                font-size: 13px;
                margin-bottom: 30px;
            }
            .certificate-body {
                font-size: 15px;
                margin-bottom: 30px;
            }
            .certificate-body2 {
                font-size: 18px;
                margin-bottom: 30px;
            }
            .certificate-body h2 {
                font-size: 24px;
                margin: 10px 0;
            }
            .certificate-footer {
                font-size: 12px;
                margin-top: 50px;
            }
            .certificate-footer2 {
                font-size: 15px;
                margin-top: 50px;
            }
            .certificate-logo {
                width: 100px;
                margin: 0 auto 20px; 
            }
            .certificate-seal {
                width: 100px;
                margin: 20px auto 0; 
            }
            hr {
                border: none;
                border-top: 2px solid #000;
                width: 50%;
                margin: 10px auto;
            }
            .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 85px;
                color: rgba(0, 0, 0, 0.1);
                font-weight: bold;
                z-index: 0; 
            }
            .qr-code {
                width: 100px;
                margin: 20px auto;
            }
        </style>
    </head>
    <body>
        <div class="certificate-outer-container">
            <div class="watermark">ARZAAK</div>
            <div class="certificate-inner-container">
            <br></br>
                <img src="https://arzaaks3.s3.amazonaws.com/001.png" class="certificate-logo" alt="Logo" />
                <div>
                    <div class="certificate-header">
                        Certificat de reconnaissance
                    </div>
                    <div class="certificate-subheader">
                        Présenté à
                    </div>
                    <div class="certificate-body">
                        <h2>${userName}</h2>
                    </div>
                    <div class="certificate-body2">
                        <p>pour avoir effectué avec succès la formation <b>${quizTitle}</b></p>
                        <p>et en reconnaissance de son engagement et de ses compétences acquises.</p>
                    </div>
                    <div class="certificate-footer">
                        <p>DATE : ${date}</p>
                        <hr>
                    </div>
                    <div class="certificate-footer2">
                        <p style="font-weight: bold; color: #ff9900;">ARZAAK</p>
                    </div>
                </div>
            
                <img src="${qrCodeUrl}" class="qr-code" alt="QR Code" />
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            timeout: 60000 
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf({ format: 'A4' });
        await browser.close();
        return pdfBuffer;
    } catch (error) {
        console.error('Erreur lors de la génération du PDF avec Puppeteer:', error);
        throw error;
    }
};

const saveCertificateToDB = async (userId, quizId, pdfBuffer) => {
    const certificate = new Certificate({
        userId: userId,
        quizId: quizId,
        createdAt: new Date(),
        pdf: pdfBuffer 
    });

    const savedCertificate = await certificate.save();

    await User.findByIdAndUpdate(userId, {
        $push: { certificates: savedCertificate._id }
    });

    return savedCertificate._id;
};

const downloadCertificate = async (req, res) => {
    const { userId, quizId } = req.body;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "L'utilisateur spécifié n'existe pas." });
        }

        const quiz = await Quiz.findById(quizId);

        if (!quiz) {
            return res.status(404).json({ message: "Le quiz spécifié n'existe pas." });
        }
        const existingCertificate = await Certificate.findOne({ userId: userId, quizId: quizId });

        if (existingCertificate) {
            return res.status(400).json({ message: "L'utilisateur a déjà un certificat pour ce quiz." });
        }
        const userName = `${user.firstname} ${user.lastname}`; 
        const quizTitle = quiz.title; 
        const qrCodeUrl = await QRCode.toDataURL(`http://localhost:4000/certificate/${userId}/${quizId}`);

        const pdfBuffer = await generatePdf(userName, quizTitle, new Date().toLocaleDateString(), qrCodeUrl);
        const certificateId = await saveCertificateToDB(user._id, quiz._id, pdfBuffer);
        const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
        <title>Bienvenue chez ARZAAK</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { width: 80%; margin: 20px auto; padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; }
          .header { background-color: #f9a11b; color: white; padding: 10px 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f9a11b; color: white; text-align: center; padding: 10px 20px; }
          
        </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bienvenue chez ARZAAK</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${userName}</strong>,</p>
              <p>Nous sommes heureux de vous informer que vous avez obtenu un certificat de ${quizTitle}.</p>
              <p>veuillez trouver ci-joint votre certificat.</p>
              <p>N'hésitez pas à nous contacter si vous avez des questions ou besoin d'assistance.</p>
            </div>
            <div class="footer">
              Cordialement,<br>
              L'équipe d'Arzaak
            </div>
          </div>
        </body>
        </html>
        `;
       
        const mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: user.email,
            subject: "Certificat de Réussite",
            html: emailContent,
            attachments: [
                {
                    filename: `Certificat_De_Reconnaissance_Arzaak_${user.firstname}_${user.lastname}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        await sendEmail(mailOptions);

        res.status(200).json({ certificateId });
    } catch (error) {
        console.error('Erreur lors de la génération du certificat:', error);
        res.status(500).send('Erreur lors de la génération du certificat');
    }
};

const getCertificate = async (req, res) => {
    const { userId, quizId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "L'utilisateur spécifié n'existe pas." });
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Le quiz spécifié n'existe pas." });
        }

        const certificate = await Certificate.findOne({ userId: userId, quizId: quizId });
        if (!certificate) {
            return res.status(404).json({ message: "Le certificat n'existe pas." });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Certificat De Reconnaissance- Arzaak -${user.firstname} ${user.lastname}-.pdf`);
        res.send(certificate.pdf);
    } catch (error) {
        console.error('Erreur lors de la récupération du certificat:', error);
        res.status(500).send('Erreur lors de la récupération du certificat');
    }
};

const getCertificatesForUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "L'utilisateur spécifié n'existe pas." });
        }

        const certificates = await Certificate.find({ userId: userId });
        
        const certificatesWithQuizTitles = await Promise.all(certificates.map(async (certificate) => {
            const quiz = await Quiz.findById(certificate.quizId);
            const { pdf, ...rest } = certificate._doc;
            const qrCodeUrl = await QRCode.toDataURL(`http://localhost:4000/certificate/${userId}/${certificate.quizId}`);
            return {
                ...rest,
                quizTitle: quiz ? quiz.title : 'Titre de quiz introuvable',
                qrCode: qrCodeUrl
            };
        }));

        res.status(200).json(certificatesWithQuizTitles);
    } catch (error) {
        console.error('Erreur lors de la récupération des certificats pour l\'utilisateur:', error);
        res.status(500).send('Erreur lors de la récupération des certificats');
    }
};

module.exports = {
    downloadCertificate,
    getCertificate,
    getCertificatesForUser,
};