const express = require("express");
const { handleChatRequest } = require("../controllers/aiControllers/chatController");
const { handleImageRequest } = require("../controllers/aiControllers/imageController");
const { handleImageAnalysisRequest } = require('../controllers/aiControllers/analyseController');
const { handleTextToSpeechRequest } = require('../controllers/aiControllers/speechController');
const { handleMusicGenerationRequest } = require('../controllers/aiControllers/musicController'); 
const { getUserMusicDetails } = require('../controllers/aiControllers/musicController');
const { handleCustomMusicGenerationRequest } = require('../controllers/aiControllers/musicController');
const { handleLumaGenerationRequest } = require('../controllers/aiControllers/lumaController');

const { handleSimpleImage } = require("../controllers/aiControllers/simpleImage");

const router = express.Router();

router.post("/chat", handleChatRequest);
router.post("/image", handleImageRequest);
router.post("/simple-image", handleSimpleImage);

router.post('/vision', handleImageAnalysisRequest);
router.post('/tts', handleTextToSpeechRequest);
router.post('/music', handleMusicGenerationRequest); 
router.get('/music/details', getUserMusicDetails);
router.post('/music/custom_generate', handleCustomMusicGenerationRequest);
router.post('/luma-ai/generations', handleLumaGenerationRequest);



module.exports = router;
