function generatePassword(length = 10) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

function sendEmail(to, subject, body) {
    console.log(`
==================================================
              📧 MOCK EMAIL SERVICE 📧            
--------------------------------------------------
TO:      ${to}
SUBJECT: ${subject}
--------------------------------------------------
${body}
==================================================
`);
}

module.exports = { generatePassword, sendEmail };
