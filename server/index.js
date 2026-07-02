require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 4000;

// Configure CORS for production.
// You can restrict this to your actual domains if you have a web frontend.
// Since it's a mobile app, it doesn't strictly enforce CORS like browsers, 
// but it's good practice to leave it open for the app to connect.
app.use(cors());
app.use(express.json());

const AUTHKEY = process.env.AUTHKEY;
const SID = process.env.SID;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key';
let MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
async function startServer() {
  if (!MONGO_URI) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    MONGO_URI = mongoServer.getUri();
    console.log(`\n\n---------------------------------------------------------`);
    console.log(`🟡 RUNNING LOCALLY WITH MONGODB MEMORY SERVER`);
    console.log(`---------------------------------------------------------\n`);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB');
    console.error(err.message);
    console.error('⚠️ NOTE: You must provide a valid MONGO_URI environment variable in Render.');
  }

  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

// --- Mongoose Models ---

// User Model
const userSchema = new mongoose.Schema({
  mobileNumber: { type: String, required: true, unique: true },
  profileCompleted: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// OTP Model
const otpSchema = new mongoose.Schema({
  mobileNumber: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } // TTL index: documents expire after 300s (5 min)
});
const OTP = mongoose.model('OTP', otpSchema);

// --- Routes ---

app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    
    if (!mobileNumber) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    if (!AUTHKEY || !SID) {
      console.error('❌ Missing AUTHKEY or SID in environment variables.');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    // Generate a random 6-digit OTP
    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    // Call AuthKey Standard SMS API with custom variables
    // We pass &otp= and &company= so the AuthKey template populates them.
    const authKeyUrl = `https://console.authkey.io/restapi/request.php?authkey=${AUTHKEY}&mobile=${mobileNumber}&country_code=91&sid=${SID}&otp=${generatedOTP}&company=Caffelino`;
    
    console.log(`[Send OTP] Generated OTP: ${generatedOTP}`);
    console.log(`[Send OTP] Requesting OTP for ${mobileNumber}...`);
    
    const response = await axios.get(authKeyUrl);
    console.log(`[Send OTP] AuthKey Response:`, response.data);

    // Store OTP in MongoDB
    // First, delete any existing OTP for this number to prevent clutter
    await OTP.deleteMany({ mobileNumber });
    
    await OTP.create({
      mobileNumber,
      otp: generatedOTP
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

    console.log(`[Verify OTP] Verifying OTP ${otp} for mobile ${mobileNumber}...`);
    
    // Find OTP in database
    const storedData = await OTP.findOne({ mobileNumber });
    
    if (!storedData) {
      console.error(`[Verify OTP] Verification failed: No OTP found for this number`);
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new one.' });
    }
    
    if (storedData.otp !== otp) {
      console.error(`[Verify OTP] Verification failed: Invalid OTP`);
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // OTP is valid!
    console.log(`[Verify OTP] OTP ${otp} successfully verified!`);
    
    // Remove OTP after successful use
    await OTP.deleteOne({ _id: storedData._id });
    
    // Check if user exists
    let user = await User.findOne({ mobileNumber });
    let isNewUser = false;
    
    if (!user) {
      isNewUser = true;
      user = await User.create({
        mobileNumber,
        profileCompleted: false,
        isVerified: true
      });
    }

    const token = jwt.sign({ id: user._id, mobileNumber }, JWT_SECRET, { expiresIn: '30d' });

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

startServer();
