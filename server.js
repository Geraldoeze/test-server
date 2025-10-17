// const express = require('express');
// const axios = require('axios');
// const cors = require('cors');
// const multer = require('multer');
// const FormData = require('form-data');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 5200;

// // Configure multer for file uploads (selfie images)
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed'), false);
//     }
//   }
// });

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Dojah configuration
// const DOJAH_CONFIG = {
//   baseUrl: process.env.DOJAH_BASE_URL || 'https://api.dojah.io',
//   appId: process.env.DOJAH_APP_ID,
//   publicKey: process.env.DOJAH_PUBLIC_KEY,
//   privateKey: process.env.DOJAH_PRIVATE_KEY,
// };

// // Validate environment variables
// if (!DOJAH_CONFIG.appId || !DOJAH_CONFIG.publicKey || !DOJAH_CONFIG.privateKey) {
//   console.error('Missing required Dojah environment variables!');
//   console.error('Please set: DOJAH_APP_ID, DOJAH_PUBLIC_KEY, DOJAH_PRIVATE_KEY');
//   process.exit(1);
// }

// // Health check endpoint
// app.get('/', (req, res) => {
//     console.log('Health check endpoint hit');
//   res.json({
//     message: 'Dojah Testing Server is running!',
//     timestamp: new Date().toISOString(),
//     features: [
//         'NIN Lookup',
//         'NIN + Selfie Verification',
//         'vNIN Support',
//         'Face Match Verification'
//       ]
//   });
// });

// // 1. Basic NIN Lookup (without selfie)
// app.post('/api/verify-nin-basic', async (req, res) => {
//     try {
//       const { nin } = req.body;

//       if (!nin) {
//         return res.status(400).json({
//           success: false,
//           message: 'NIN is required',
//         });
//       }

//       console.log('Looking up NIN:', nin);

//       const response = await axios.post(
//         `${DOJAH_CONFIG.baseUrl}/api/v1/kyc/nin`,
//         { nin },
//         {
//           headers: getDojahHeaders(),
//           timeout: 30000,
//         }
//       );

//       if (response.data && response.data.entity) {
//         res.json({
//           success: true,
//           data: {
//             verified: true,
//             personalInfo: {
//               firstName: response.data.entity.firstname,
//               middleName: response.data.entity.middlename,
//               lastName: response.data.entity.surname,
//               dateOfBirth: response.data.entity.birthdate,
//               gender: response.data.entity.gender,
//               phone: response.data.entity.telephoneno,
//               // Note: Actual photo is not returned due to privacy regulations
//             },
//             nin: nin,
//             verificationId: `basic_${Date.now()}`,
//           },
//         });
//       } else {
//         res.status(404).json({
//           success: false,
//           message: 'NIN not found or invalid',
//         });
//       }
//     } catch (error) {
//       console.error('Error verifying NIN:', error.message);
//       res.status(error.response?.status || 500).json({
//         success: false,
//         message: error.response?.data?.message || 'Failed to verify NIN',
//       });
//     }
//   });

//   // 2. NIN Verification with Selfie (Face Match)
//   app.post('/api/verify-nin-with-selfie', upload.single('selfie'), async (req, res) => {
//     try {
//       const { nin } = req.body;
//       const selfieFile = req.file;

//       if (!nin) {
//         return res.status(400).json({
//           success: false,
//           message: 'NIN is required',
//         });
//       }

//       if (!selfieFile) {
//         return res.status(400).json({
//           success: false,
//           message: 'Selfie image is required',
//         });
//       }

//       console.log('Verifying NIN with selfie:', nin);

//       // Create FormData for multipart/form-data request
//       const formData = new FormData();
//       formData.append('nin', nin);
//       formData.append('selfie', selfieFile.buffer, {
//         filename: 'selfie.jpg',
//         contentType: selfieFile.mimetype,
//       });

//       const response = await axios.post(
//         `${DOJAH_CONFIG.baseUrl}/api/v1/kyc/nin/verify`,
//         formData,
//         {
//           headers: {
//             ...formData.getHeaders(),
//             'Authorization': `Bearer ${DOJAH_CONFIG.privateKey}`,
//             'AppId': DOJAH_CONFIG.appId,
//           },
//           timeout: 45000, // Longer timeout for image processing
//         }
//       );

//       if (response.data) {
//         const result = response.data;

//         res.json({
//           success: true,
//           data: {
//             verified: result.verified || false,
//             faceMatch: result.face_match || false,
//             confidence: result.confidence || 0,
//             personalInfo: result.entity ? {
//               firstName: result.entity.firstname,
//               middleName: result.entity.middlename,
//               lastName: result.entity.surname,
//               dateOfBirth: result.entity.birthdate,
//               gender: result.entity.gender,
//               phone: result.entity.telephoneno,
//             } : null,
//             nin: nin,
//             verificationId: `selfie_${Date.now()}`,
//             timestamp: new Date().toISOString(),
//           },
//         });
//       } else {
//         res.status(400).json({
//           success: false,
//           message: 'Verification failed',
//         });
//       }
//     } catch (error) {
//       console.error('Error verifying NIN with selfie:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status,
//       });

//       res.status(error.response?.status || 500).json({
//         success: false,
//         message: error.response?.data?.message || 'Failed to verify NIN with selfie',
//         details: process.env.NODE_ENV === 'development' ? error.response?.data : undefined,
//       });
//     }
//   });

//   // 3. vNIN (Virtual NIN) Verification with Selfie
//   app.post('/api/verify-vnin-with-selfie', upload.single('selfie'), async (req, res) => {
//     try {
//       const { vnin } = req.body;
//       const selfieFile = req.file;

//       if (!vnin) {
//         return res.status(400).json({
//           success: false,
//           message: 'vNIN is required',
//         });
//       }

//       if (!selfieFile) {
//         return res.status(400).json({
//           success: false,
//           message: 'Selfie image is required',
//         });
//       }

//       console.log('Verifying vNIN with selfie:', vnin);

//       const formData = new FormData();
//       formData.append('vnin', vnin);
//       formData.append('selfie', selfieFile.buffer, {
//         filename: 'selfie.jpg',
//         contentType: selfieFile.mimetype,
//       });

//       const response = await axios.post(
//         `${DOJAH_CONFIG.baseUrl}/api/v1/kyc/vnin/verify`,
//         formData,
//         {
//           headers: {
//             ...formData.getHeaders(),
//             'Authorization': `Bearer ${DOJAH_CONFIG.privateKey}`,
//             'AppId': DOJAH_CONFIG.appId,
//           },
//           timeout: 45000,
//         }
//       );

//       if (response.data) {
//         const result = response.data;

//         res.json({
//           success: true,
//           data: {
//             verified: result.verified || false,
//             faceMatch: result.face_match || false,
//             confidence: result.confidence || 0,
//             personalInfo: result.entity ? {
//               firstName: result.entity.firstname,
//               middleName: result.entity.middlename,
//               lastName: result.entity.surname,
//               dateOfBirth: result.entity.birthdate,
//               gender: result.entity.gender,
//               phone: result.entity.telephoneno,
//             } : null,
//             vnin: vnin,
//             verificationId: `vnin_${Date.now()}`,
//             timestamp: new Date().toISOString(),
//           },
//         });
//       } else {
//         res.status(400).json({
//           success: false,
//           message: 'vNIN verification failed',
//         });
//       }
//     } catch (error) {
//       console.error('Error verifying vNIN with selfie:', error.message);
//       res.status(error.response?.status || 500).json({
//         success: false,
//         message: error.response?.data?.message || 'Failed to verify vNIN with selfie',
//       });
//     }
//   });

//   // 4. Complete KYC Flow - NIN + Liveness + Face Match
//   app.post('/api/complete-kyc-verification', upload.single('selfie'), async (req, res) => {
//     try {
//       const { nin, firstName, lastName, dateOfBirth } = req.body;
//       const selfieFile = req.file;

//       // Validation
//       if (!nin || !firstName || !lastName) {
//         return res.status(400).json({
//           success: false,
//           message: 'NIN, firstName, and lastName are required',
//         });
//       }

//       if (!selfieFile) {
//         return res.status(400).json({
//           success: false,
//           message: 'Selfie image is required for verification',
//         });
//       }

//       console.log('Starting complete KYC verification for:', { nin, firstName, lastName });

//       // Step 1: Basic NIN lookup
//       console.log('Step 1: Basic NIN lookup...');
//       const ninLookup = await axios.post(
//         `${DOJAH_CONFIG.baseUrl}/api/v1/kyc/nin`,
//         { nin },
//         {
//           headers: getDojahHeaders(),
//           timeout: 30000,
//         }
//       );

//       if (!ninLookup.data || !ninLookup.data.entity) {
//         return res.status(404).json({
//           success: false,
//           message: 'NIN not found in database',
//           step: 'nin_lookup',
//         });
//       }

//       const ninData = ninLookup.data.entity;

//       // Step 2: Name matching
//       console.log('Step 2: Name matching...');
//       const nameMatch = (
//         ninData.firstname.toLowerCase().includes(firstName.toLowerCase()) &&
//         ninData.surname.toLowerCase().includes(lastName.toLowerCase())
//       );

//       // Step 3: Face verification
//       console.log('Step 3: Face verification...');
//       const formData = new FormData();
//       formData.append('nin', nin);
//       formData.append('selfie', selfieFile.buffer, {
//         filename: 'selfie.jpg',
//         contentType: selfieFile.mimetype,
//       });

//       const faceVerification = await axios.post(
//         `${DOJAH_CONFIG.baseUrl}/api/v1/kyc/nin/verify`,
//         formData,
//         {
//           headers: {
//             ...formData.getHeaders(),
//             'Authorization': `Bearer ${DOJAH_CONFIG.privateKey}`,
//             'AppId': DOJAH_CONFIG.appId,
//           },
//           timeout: 45000,
//         }
//       );

//       const faceMatch = faceVerification.data?.face_match || false;
//       const confidence = faceVerification.data?.confidence || 0;

//       // Calculate overall verification score
//       let verificationScore = 0;
//       if (nameMatch) verificationScore += 30;
//       if (faceMatch) verificationScore += 70;

//       const isFullyVerified = nameMatch && faceMatch && confidence > 0.7;

//       res.json({
//         success: true,
//         data: {
//           verified: isFullyVerified,
//           verificationScore: verificationScore,
//           details: {
//             ninValid: true,
//             nameMatch: nameMatch,
//             faceMatch: faceMatch,
//             confidence: confidence,
//           },
//           personalInfo: {
//             firstName: ninData.firstname,
//             middleName: ninData.middlename,
//             lastName: ninData.surname,
//             dateOfBirth: ninData.birthdate,
//             gender: ninData.gender,
//             phone: ninData.telephoneno,
//           },
//           providedInfo: {
//             firstName,
//             lastName,
//             dateOfBirth,
//           },
//           nin: nin,
//           verificationId: `complete_${Date.now()}`,
//           timestamp: new Date().toISOString(),
//           recommendations: isFullyVerified
//             ? ['Proceed with onboarding']
//             : [
//                 !nameMatch && 'Name mismatch detected',
//                 !faceMatch && 'Face verification failed',
//                 confidence <= 0.7 && 'Low confidence score'
//               ].filter(Boolean),
//         },
//       });

//     } catch (error) {
//       console.error('Error in complete KYC verification:', error.message);
//       res.status(error.response?.status || 500).json({
//         success: false,
//         message: 'Complete KYC verification failed',
//         error: error.response?.data?.message || error.message,
//       });
//     }
//   });

//   // 5. Liveness Detection (separate endpoint)
//   app.post('/api/liveness-detection', upload.single('selfie'), async (req, res) => {
//     try {
//       const selfieFile = req.file;

//       if (!selfieFile) {
//         return res.status(400).json({
//           success: false,
//           message: 'Selfie image is required',
//         });
//       }

//       console.log('Performing liveness detection...');

//       const formData = new FormData();
//       formData.append('image', selfieFile.buffer, {
//         filename: 'selfie.jpg',
//         contentType: selfieFile.mimetype,
//       });

//       const response = await axios.post(
//         `${DOJAH_CONFIG.baseUrl}/api/v1/ml/liveness`,
//         formData,
//         {
//           headers: {
//             ...formData.getHeaders(),
//             'Authorization': `Bearer ${DOJAH_CONFIG.privateKey}`,
//             'AppId': DOJAH_CONFIG.appId,
//           },
//           timeout: 30000,
//         }
//       );

//       res.json({
//         success: true,
//         data: {
//           isLive: response.data?.live || false,
//           confidence: response.data?.confidence || 0,
//           verificationId: `liveness_${Date.now()}`,
//         },
//       });
//     } catch (error) {
//       console.error('Error in liveness detection:', error.message);
//       res.status(error.response?.status || 500).json({
//         success: false,
//         message: 'Liveness detection failed',
//       });
//     }
//   });

//   // Error handling middleware
//   app.use((error, req, res, next) => {
//     if (error instanceof multer.MulterError) {
//       if (error.code === 'LIMIT_FILE_SIZE') {
//         return res.status(400).json({
//           success: false,
//           message: 'File size too large. Maximum size is 5MB.',
//         });
//       }
//     }

//     console.error('Server error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Internal server error',
//     });
//   });

// // Create verification session endpoint
// app.post('/api/create-verification-session', async (req, res) => {
//   try {
//     const {
//       firstName = 'Test',
//       lastName = 'User',
//       email = 'test@example.com',
//       phone,
//       referenceId,
//     } = req.body;

//     // Generate reference ID if not provided
//     const sessionReferenceId = referenceId || `test_${Date.now()}`;

//     console.log('Creating Dojah verification session:', {
//       referenceId: sessionReferenceId,
//       firstName,
//       lastName,
//       email,
//     });

//     // Create verification session with Dojah
//     const response = await axios.post(
//       `${DOJAH_CONFIG.baseUrl}/api/v1/widget/create-session`,
//       {
//         reference_id: sessionReferenceId,
//         user_data: {
//           first_name: firstName,
//           last_name: lastName,
//           email: email,
//           ...(phone && { phone }),
//         },
//         config: {
//           pages: ['selfie', 'document'],
//           selfie_config: {
//             enable_liveness: true,
//             capture_multiple: false,
//             quality_threshold: 0.8,
//           },
//           document_config: {
//             enable_validation: true,
//             document_types: ['passport', 'drivers_license', 'national_id'],
//           },
//           webhook_url: `${req.protocol}://${req.get('host')}/api/webhook`,
//           redirect_url: `${req.protocol}://${req.get('host')}/api/verification-complete`,
//         },
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${DOJAH_CONFIG.privateKey}`,
//           'AppId': DOJAH_CONFIG.appId,
//         },
//         timeout: 30000, // 30 seconds timeout
//       }
//     );

//     if (response.data && response.data.success) {
//       const sessionData = response.data.data;

//       // Construct verification URL
//       const verificationUrl = `https://identity.dojah.io/session/${sessionData.session_id}?public_key=${DOJAH_CONFIG.publicKey}`;

//       res.json({
//         success: true,
//         data: {
//           sessionId: sessionData.session_id,
//           verificationUrl,
//           referenceId: sessionReferenceId,
//         },
//       });

//       console.log('Session created successfully:', sessionData.session_id);
//     } else {
//       throw new Error(response.data?.message || 'Failed to create session');
//     }
//   } catch (error) {
//     console.error('Error creating verification session:', {
//       message: error.message,
//       response: error.response?.data,
//       status: error.response?.status,
//     });

//     res.status(500).json({
//       success: false,
//       message: error.response?.data?.message || error.message || 'Failed to create verification session',
//       details: process.env.NODE_ENV === 'development' ? error.response?.data : undefined,
//     });
//   }
// });

// // Alternative endpoint: Get verification URL with Widget ID
// app.post('/api/get-verification-url', (req, res) => {
//   try {
//     const {
//       widgetId,
//       firstName = 'Test',
//       lastName = 'User',
//       email = 'test@example.com',
//       referenceId,
//     } = req.body;

//     if (!widgetId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Widget ID is required',
//       });
//     }

//     const sessionReferenceId = referenceId || `test_${Date.now()}`;

//     // Create verification URL with widget ID
//     const params = new URLSearchParams({
//       widget_id: widgetId,
//       reference_id: sessionReferenceId,
//       'user_data[first_name]': firstName,
//       'user_data[last_name]': lastName,
//       'user_data[email]': email,
//     });

//     const verificationUrl = `https://identity.dojah.io?${params.toString()}`;

//     res.json({
//       success: true,
//       data: {
//         verificationUrl,
//         referenceId: sessionReferenceId,
//       },
//     });

//     console.log('Verification URL created with Widget ID:', widgetId);
//   } catch (error) {
//     console.error('Error creating verification URL:', error.message);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// // Webhook endpoint to receive verification results
// app.post('/api/webhook', (req, res) => {
//   console.log('Webhook received:', JSON.stringify(req.body, null, 2));

//   // Process the webhook data
//   const { event, data } = req.body;

//   switch (event) {
//     case 'verification.completed':
//       console.log('Verification completed:', data.reference_id);
//       break;
//     case 'verification.failed':
//       console.log('Verification failed:', data.reference_id);
//       break;
//     case 'verification.cancelled':
//       console.log('Verification cancelled:', data.reference_id);
//       break;
//     default:
//       console.log('Unknown webhook event:', event);
//   }

//   res.status(200).json({ received: true });
// });

// // Verification complete redirect endpoint
// app.get('/api/verification-complete', (req, res) => {
//   const { reference_id, status } = req.query;

//   console.log('Verification complete redirect:', { reference_id, status });

//   res.send(`
//     <html>
//       <body>
//         <h2>Verification ${status === 'success' ? 'Completed Successfully!' : 'Result'}</h2>
//         <p>Reference ID: ${reference_id}</p>
//         <p>Status: ${status}</p>
//         <script>
//           // Close WebView or redirect back to app
//           if (window.ReactNativeWebView) {
//             window.ReactNativeWebView.postMessage(JSON.stringify({
//               type: 'verification_complete',
//               referenceId: '${reference_id}',
//               status: '${status}'
//             }));
//           }
//         </script>
//       </body>
//     </html>
//   `);
// });

// // Get session status
// app.get('/api/session-status/:referenceId', async (req, res) => {
//   try {
//     const { referenceId } = req.params;

//     // You can implement a call to Dojah's API to check session status
//     // For now, return a simple response
//     res.json({
//       success: true,
//       data: {
//         referenceId,
//         status: 'pending', // This would come from Dojah's API
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error('Server error:', err);
//   res.status(500).json({
//     success: false,
//     message: 'Internal server error',
//   });
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`🚀 Dojah Testing Server running on port ${PORT}`);
//   console.log(`📝 Health check: http://localhost:${PORT}`);
//   console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);

//   // Log configuration (without sensitive data)
//   console.log('Configuration:', {
//     baseUrl: DOJAH_CONFIG.baseUrl,
//     appId: DOJAH_CONFIG.appId,
//     publicKeyConfigured: !!DOJAH_CONFIG.publicKey,
//     privateKeyConfigured: !!DOJAH_CONFIG.privateKey,
//   });
// });

// module.exports = app;

const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 6000;

// Middleware
app.use(cors());
app.use(express.json());

// Dojah config
const DOJAH_CONFIG = {
  baseUrl: process.env.DOJAH_BASE_URL || "https://api.dojah.io",
  appId: process.env.DOJAH_APP_ID,
  publicKey: process.env.DOJAH_PUBLIC_KEY,
  privateKey: process.env.DOJAH_PRIVATE_KEY,
};

if (
  !DOJAH_CONFIG.appId ||
  !DOJAH_CONFIG.publicKey ||
  !DOJAH_CONFIG.privateKey
) {
  console.error(
    "❌ Missing Dojah credentials. Please set DOJAH_APP_ID, DOJAH_PUBLIC_KEY, DOJAH_PRIVATE_KEY."
  );
  process.exit(1);
}

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ ok: true, message: "Backend server is reachable 🚀" });
  // res.json({
  //   message: 'Dojah KYC API server is running!',
  //   timestamp: new Date().toISOString(),
  //   activeEndpoints: [
  //     '/api/create-verification-session',
  //     '/api/get-verification-url'
  //   ],
  // });
});

// ✅ Used by RN app to create session
// app.post('/api/create-verification-session', async (req, res) => {
//   try {
//     const { firstName = 'Test', lastName = 'User', email = 'test@example.com', phone, referenceId } = req.body;
//     const sessionReferenceId = referenceId || `test_${Date.now()}`;

//     const response = await axios.post(
//       `${DOJAH_CONFIG.baseUrl}/api/v1/widget/create-session`,
//       {
//         reference_id: sessionReferenceId,
//         user_data: { first_name: firstName, last_name: lastName, email, ...(phone && { phone }) },
//         config: {
//           pages: ['selfie', 'document'],
//           selfie_config: { enable_liveness: true },
//           document_config: { enable_validation: true, document_types: ['national_id'] },
//           webhook_url: `${req.protocol}://${req.get('host')}/api/webhook`,
//           redirect_url: `${req.protocol}://${req.get('host')}/api/verification-complete`,
//         },
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${DOJAH_CONFIG.privateKey}`,
//           'AppId': DOJAH_CONFIG.appId,
//         },
//       }
//     );

//     if (response.data?.success) {
//       const sessionData = response.data.data;
//       const verificationUrl = `https://identity.dojah.io/session/${sessionData.session_id}?public_key=${DOJAH_CONFIG.publicKey}`;
//       res.json({
//         success: true,
//         data: { sessionId: sessionData.session_id, verificationUrl, referenceId: sessionReferenceId },
//       });
//     } else {
//       throw new Error(response.data?.message || 'Failed to create Dojah session');
//     }
//   } catch (error) {
//     console.error('Error creating session:');
//     if (error.response) {
//       console.error('Status:', error.response.status);
//       console.error('Data:', error.response.data);
//     } else {
//       console.error('Message:', error.message);
//     }

//     res.status(error.response?.status || 500).json({
//       success: false,
//       message: error.response?.data?.message || error.message,
//       details: error.response?.data,
//     });
//   }
// });

// app.post('/api/create-verification-session', async (req, res) => {
//   try {
//     const {
//       firstName = 'Test',
//       lastName = 'User',
//       email = 'test@example.com',
//       phone,
//       referenceId,
//     } = req.body;

//     const sessionReferenceId = referenceId || `test_${Date.now()}`;

//     const response = await axios.post(
//       `${DOJAH_CONFIG.baseUrl}/api/v1/kyc/widget`,
//       {
//         reference_id: sessionReferenceId,
//         user_data: {
//           first_name: firstName,
//           last_name: lastName,
//           email,
//           ...(phone && { phone }),
//         },
//         config: {
//           pages: ['selfie', 'document'],
//           selfie_config: { enable_liveness: true },
//           document_config: {
//             enable_validation: true,
//             document_types: ['national_id'],
//           },
//           webhook_url: `${req.protocol}://${req.get('host')}/api/webhook`,
//           redirect_url: `${req.protocol}://${req.get('host')}/api/verification-complete`,
//         },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${DOJAH_CONFIG.privateKey}`,
//           AppId: DOJAH_CONFIG.appId,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     if (response.data?.data?.session_id) {
//       const sessionId = response.data.data.session_id;
//       const verificationUrl = `https://identity.dojah.io/session/${sessionId}?public_key=${DOJAH_CONFIG.publicKey}`;
//       res.json({
//         success: true,
//         data: { sessionId, verificationUrl, referenceId: sessionReferenceId },
//       });
//     } else {
//       throw new Error(response.data?.message || 'Failed to create Dojah session');
//     }
//   } catch (error) {
//     console.error('Error creating session:');
//     if (error.response) {
//       console.error('Status:', error.response.status);
//       console.error('Data:', error.response.data);
//     } else {
//       console.error('Message:', error.message);
//     }
//     res.status(error.response?.status || 500).json({
//       success: false,
//       message: error.response?.data?.message || error.message,
//       details: error.response?.data,
//     });
//   }
// });

app.post("/api/create-verification-session", async (req, res) => {
  try {
    const {
      firstName = "Test",
      lastName = "User",
      email = "test@example.com",
      phone,
      referenceId,
    } = req.body;

    // Generate reference ID if not provided
    const sessionReferenceId = referenceId || `test_${Date.now()}`;

    console.log("Creating Dojah verification session:", {
      referenceId: sessionReferenceId,
      firstName,
      lastName,
      email,
    });

    // Create verification session with Dojah
    const response = await axios.post(
      `${DOJAH_CONFIG.baseUrl}/api/v1/widget/create-session`,
      {
        reference_id: sessionReferenceId,
        user_data: {
          first_name: firstName,
          last_name: lastName,
          email: email,
          ...(phone && { phone }),
        },
        config: {
          pages: ["selfie", "document"],
          selfie_config: {
            enable_liveness: true,
            capture_multiple: false,
            quality_threshold: 0.8,
          },
          document_config: {
            enable_validation: true,
            document_types: ["passport", "drivers_license", "national_id"],
          },
          webhook_url: `${req.protocol}://${req.get("host")}/api/webhook`,
          redirect_url: `${req.protocol}://${req.get(
            "host"
          )}/api/verification-complete`,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DOJAH_CONFIG.privateKey}`,
          AppId: DOJAH_CONFIG.appId,
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    if (response.data && response.data.success) {
      const sessionData = response.data.data;

      // Construct verification URL
      const verificationUrl = `https://identity.dojah.io/session/${sessionData.session_id}?public_key=${DOJAH_CONFIG.publicKey}`;

      res.json({
        success: true,
        data: {
          sessionId: sessionData.session_id,
          verificationUrl,
          referenceId: sessionReferenceId,
        },
      });

      console.log("Session created successfully:", sessionData.session_id);
    } else {
      throw new Error(response.data?.message || "Failed to create session");
    }
  } catch (error) {
    console.error("Error creating verification session:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    res.status(500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Failed to create verification session",
      details:
        process.env.NODE_ENV === "development"
          ? error.response?.data
          : undefined,
    });
  }
});
app.post("/api/get-verification-url", (req, res) => {
  const {
    widgetId,
    firstName = "Test",
    lastName = "User",
    email = "test@example.com",
    referenceId,
  } = req.body;

  if (!widgetId)
    return res
      .status(400)
      .json({ success: false, message: "Widget ID is required" });

  const sessionReferenceId = referenceId || `test_${Date.now()}`;
  const params = new URLSearchParams({
    widget_id: widgetId,
    reference_id: sessionReferenceId,
    "user_data[first_name]": firstName,
    "user_data[last_name]": lastName,
    "user_data[email]": email,
  });

  res.json({
    success: true,
    data: { 
      verificationUrl: `https://identity.dojah.io?${params.toString()}` // Changed from verification_url
    },
  });
});


// ✅ Alternative URL creation (simpler RN integration)
app.post("/api/get-verification-url", (req, res) => {
  const {
    widgetId,
    firstName = "Test",
    lastName = "User",
    email = "test@example.com",
    referenceId,
  } = req.body;
  if (!widgetId)
    return res
      .status(400)
      .json({ success: false, message: "Widget ID is required" });

  const sessionReferenceId = referenceId || `test_${Date.now()}`;
  const params = new URLSearchParams({
    widget_id: widgetId,
    reference_id: sessionReferenceId,
    "user_data[first_name]": firstName,
    "user_data[last_name]": lastName,
    "user_data[email]": email,
  });

  res.json({
    success: true,
    data: { verificationUrl: `https://identity.dojah.io?${params.toString()}` },
  });
});

// ❌ Commented out — not needed for RN app
/*
app.post('/api/verify-nin-basic', ...);
app.post('/api/verify-nin-with-selfie', ...);
app.post('/api/verify-vnin-with-selfie', ...);
app.post('/api/complete-kyc-verification', ...);
app.post('/api/liveness-detection', ...);
*/

// Start server
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
