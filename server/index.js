require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const AUTHKEY = process.env.AUTHKEY;
const SID = process.env.SID;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key';

// In-memory mock database for users and OTPs
const users = [];
const otpStore = new Map(); // mobileNumber -> { otp, expiresAt }

app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    
    if (!mobileNumber) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    // Generate a random 6-digit OTP
    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    // Call AuthKey Standard SMS API with custom variables
    // We pass &otp= and &company= so the AuthKey template populates them.
    const authKeyUrl = `https://console.authkey.io/restapi/request.php?authkey=${AUTHKEY}&mobile=${mobileNumber}&country_code=91&sid=${SID}&otp=${generatedOTP}&company=Caffelino`;
    
    console.log(`[Send OTP] Generated OTP: ${generatedOTP}`);
    console.log(`[Send OTP] Requesting OTP for ${mobileNumber} with payload URL: ${authKeyUrl}`);
    
    const response = await axios.get(authKeyUrl);
    console.log(`[Send OTP] AuthKey Response:`, response.data);

    // Store OTP in memory (valid for 5 minutes)
    otpStore.set(mobileNumber, {
      otp: generatedOTP,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    // Provide a dummy logId since we verify locally
    const logId = response.data.LogID || response.data.logid || `local_${Date.now()}`;
    return res.json({ success: true, logId });
  } catch (error) {
    console.error('Error sending OTP:', error.message);
    const authKeyMessage = error.response && error.response.data ? (error.response.data.Message || JSON.stringify(error.response.data)) : error.message;
    return res.status(500).json({ success: false, message: `Failed to send OTP: ${authKeyMessage}` });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { mobileNumber, otp, logId } = req.body;

    if (!mobileNumber || !otp || !logId) {
      return res.status(400).json({ success: false, message: 'Mobile number, OTP, and LogID are required' });
    }

    // Verify OTP locally against our in-memory store
    console.log(`[Verify OTP] Verifying OTP ${otp} for mobile ${mobileNumber}...`);
    
    const storedData = otpStore.get(mobileNumber);
    
    if (!storedData) {
      console.error(`[Verify OTP] Verification failed: No OTP found for this number`);
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new one.' });
    }
    
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(mobileNumber);
      console.error(`[Verify OTP] Verification failed: OTP Expired`);
      return res.status(400).json({ success: false, message: 'OTP Expired' });
    }
    
    if (storedData.otp !== otp) {
      console.error(`[Verify OTP] Verification failed: Invalid OTP`);
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // OTP is valid!
    console.log(`[Verify OTP] OTP ${otp} successfully verified!`);
    otpStore.delete(mobileNumber); // remove OTP after successful use

    // Since AuthKey format can vary slightly depending on exact plan, we assume success if no error was explicitly found 
    // AND it has some success indication
    
    let user = users.find(u => u.mobileNumber === mobileNumber);
    let isNewUser = false;
    
    if (!user) {
      isNewUser = true;
      user = {
        id: `user_${Date.now()}`,
        mobileNumber,
        profileCompleted: false,
        isVerified: true
      };
      users.push(user);
    }

    const token = jwt.sign({ id: user.id, mobileNumber }, JWT_SECRET, { expiresIn: '30d' });

    return res.json({
      success: true,
      token,
      user,
      isNewUser
    });

  } catch (error) {
    console.error('Error verifying OTP:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
