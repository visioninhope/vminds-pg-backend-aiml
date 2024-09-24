const pool = require('../../config/database');
const { generateMusic } = require('../../ai_models/musicModel');
const { fetchMusicDetails } = require('../../ai_models/musicModel');
const { generateCustomMusic } = require('../../ai_models/musicModel');
const model = "music";
const { updateAiToolUsage,updateTokenUsagePoints,updateLoginStreak } = require('../pointController');



// const handleMusicGenerationRequest = async (req, res) => {
//     const { prompt, makeInstrumental, waitAudio } = req.body;
//     const userId = req.userId;

//     if (!prompt) {
//         return res.status(400).json({ error: "Prompt is required." });
//     }

//     try {
//         const client = await pool.connect();

//         const userQuery = 'SELECT available_tokens, tokens_used FROM users WHERE id = $1';
//         const userResult = await client.query(userQuery, [userId]);

//         if (userResult.rows.length === 0) {
//             client.release();
//             return res.status(404).json({ error: "User not found." });
//         }

//         const user = userResult.rows[0];
//         const tokensRequired = 157000;  

//         if (user.available_tokens < tokensRequired) {
//             client.release();
//             return res.status(403).json({ error: "Insufficient tokens." });
//         }

//         const musicResponse = await generateMusic(prompt, makeInstrumental, waitAudio);

//         const newMusicIds = [musicResponse[0].id, musicResponse[1].id];

//         const existingMusicQuery = `
//             SELECT music_ids FROM user_music WHERE user_id = $1
//         `;
//         const existingMusicResult = await client.query(existingMusicQuery, [userId]);

//         if (existingMusicResult.rows.length > 0) {
//             const existingMusicIds = existingMusicResult.rows[0].music_ids;
//             const updatedMusicIds = existingMusicIds.concat(newMusicIds);

//             const updateMusicQuery = `
//                 UPDATE user_music
//                 SET music_ids = $1
//                 WHERE user_id = $2
//             `;
//             await client.query(updateMusicQuery, [JSON.stringify(updatedMusicIds), userId]);
//         } else {
//             const insertMusicQuery = `
//                 INSERT INTO user_music (user_id, music_ids)
//                 VALUES ($1, $2)
//             `;
//             await client.query(insertMusicQuery, [userId, JSON.stringify(newMusicIds)]);
//         }

//         const updateTokensQuery = `
//             UPDATE users
//             SET tokens_used = tokens_used + $1, available_tokens = available_tokens - $1
//             WHERE id = $2
//         `;
//         await client.query(updateTokensQuery, [tokensRequired, userId]);

//         const logQuery = `
//             INSERT INTO usage_logs (user_id, bot_type, request, response, tokens_used)
//             VALUES ($1, $2, $3, $4, $5)
//            RETURNING id;
//         `;
//         const logResult = await client.query(logQuery, [userId, 'music-generation', prompt, JSON.stringify(musicResponse), tokensRequired]);
//         const logId = logResult.rows[0].id;
//         await updateAiToolUsage(userId, model);
//         await updateTokenUsagePoints(userId);
//         await updateLoginStreak(userId);



//         client.release();
//         res.setHeader('Log-ID', logId); 

//         return res.status(200).json({
//             music1: {
//                 id: musicResponse[0].id,
//                 url: musicResponse[0].audio_url,
//                 image_url:musicResponse[0].image_url,
//                 title: musicResponse[0].title,
//                 model_name: musicResponse[0].model_name,
//                 tags: musicResponse[0].tags,
//             },
//             music2: {
//                 id: musicResponse[1].id,
//                 url: musicResponse[1].audio_url,
//                 image_url:musicResponse[1].image_url,
//                 title: musicResponse[1].title,
//                 model_name: musicResponse[1].model_name,
//                 tags: musicResponse[1].tags,
//             },
//             tokensUsed: tokensRequired
//                 });
//     } catch (error) {
//         console.error("Error in handleMusicGenerationRequest:", error);
//         return res.status(500).json({ error: "Failed to process music generation request." });
//     }
// };

const handleMusicGenerationRequest = async (req, res) => {
    const { prompt, makeInstrumental, waitAudio } = req.body;
    const userId = req.userId;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
    }

    try {
        const client = await pool.connect();

        // Fetch user tokens
        const userQuery = 'SELECT available_tokens, tokens_used FROM users WHERE id = $1';
        const userResult = await client.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: "User not found." });
        }

        const user = userResult.rows[0];
        const tokensRequired = 157000;  // Example token cost

        if (user.available_tokens < tokensRequired) {
            client.release();
            return res.status(403).json({ error: "Insufficient tokens." });
        }

        // Call the music generation API
        const musicResponse = await generateMusic(prompt, makeInstrumental, waitAudio);

        // Ensure the response is an array
        if (!Array.isArray(musicResponse)) {
            throw new Error('Invalid music response format.');
        }

        const newMusicIds = [musicResponse[0].id, musicResponse[1].id];

        // Fetch existing music ids for the user
        const existingMusicQuery = 'SELECT music_ids FROM user_music WHERE user_id = $1';
        const existingMusicResult = await client.query(existingMusicQuery, [userId]);

        if (existingMusicResult.rows.length > 0) {
            const existingMusicIds = existingMusicResult.rows[0].music_ids;
            const updatedMusicIds = existingMusicIds.concat(newMusicIds);

            const updateMusicQuery = 'UPDATE user_music SET music_ids = $1 WHERE user_id = $2';
            await client.query(updateMusicQuery, [JSON.stringify(updatedMusicIds), userId]);
        } else {
            const insertMusicQuery = 'INSERT INTO user_music (user_id, music_ids) VALUES ($1, $2)';
            await client.query(insertMusicQuery, [userId, JSON.stringify(newMusicIds)]);
        }

        // Update tokens used and available
        const updateTokensQuery = 'UPDATE users SET tokens_used = tokens_used + $1, available_tokens = available_tokens - $1 WHERE id = $2';
        await client.query(updateTokensQuery, [tokensRequired, userId]);

        // Log the usage in usage_logs
        const logQuery = `
            INSERT INTO usage_logs (user_id, bot_type, request, response, tokens_used)
            VALUES ($1, $2, $3, $4, $5)
           RETURNING id;
        `;
        const logResult = await client.query(logQuery, [userId, 'music-generation', prompt, JSON.stringify(musicResponse), tokensRequired]);
        const logId = logResult.rows[0].id;

        // Update user tool usage, token points, and login streak
    // Update AI tool usage and get the reward response
        const usageUpdateResult = await updateAiToolUsage(userId, model);

    // Update token usage points
        const tokenUsageRes = await updateTokenUsagePoints(userId);
        await updateLoginStreak(userId);

        // Release client and return response
        client.release();
        res.setHeader('Log-ID', logId);

        return res.status(200).json({
            music1: {
                id: musicResponse[0].id,
                url: musicResponse[0].audio_url,
                image_url: musicResponse[0].image_url,
                title: musicResponse[0].title,
                model_name: musicResponse[0].model_name,
                tags: musicResponse[0].tags,
            },
            music2: {
                id: musicResponse[1].id,
                url: musicResponse[1].audio_url,
                image_url: musicResponse[1].image_url,
                title: musicResponse[1].title,
                model_name: musicResponse[1].model_name,
                tags: musicResponse[1].tags,
            },
            tokensUsed: tokensRequired,
            usageUpdate: usageUpdateResult,
            tokenUsage: tokenUsageRes
        });

    } catch (error) {
        console.error("Error in handleMusicGenerationRequest:", error);
        return res.status(500).json({ error: "Failed to process music generation request." });
    }
};

const getUserMusicDetails = async (req, res) => {
    const userId = req.userId;

    try {
        const client = await pool.connect();
        const userMusicQuery = 'SELECT music_ids FROM user_music WHERE user_id = $1';
        const userMusicResult = await client.query(userMusicQuery, [userId]);

        if (userMusicResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: "No music found for this user." });
        }

        const musicIds = userMusicResult.rows[0].music_ids;

        // Break down into smaller batches
        const musicDetailsPromises = [];
        const batchSize = 5;
        for (let i = 0; i < musicIds.length; i += batchSize) {
            const batch = musicIds.slice(i, i + batchSize);
            musicDetailsPromises.push(fetchMusicDetails(batch));
        }

        const musicDetailsArray = await Promise.all(musicDetailsPromises);
        const musicDetails = musicDetailsArray.flat();

        client.release();

        return res.status(200).json({ musicDetails });
    } catch (error) {
        console.error("Error in getUserMusicDetails:", error.message);
        return res.status(500).json({ error: "Failed to fetch music details." });
    }
};
const handleCustomMusicGenerationRequest = async (req, res) => {
    const { prompt, tags, title, makeInstrumental, waitAudio } = req.body;
    const userId = req.userId;

    if (!prompt || !title || !tags) {
        return res.status(400).json({ error: "Prompt, title, and tags are required." });
    }

    try {
        const client = await pool.connect();

        const userQuery = 'SELECT available_tokens, tokens_used FROM users WHERE id = $1';
        const userResult = await client.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: "User not found." });
        }

        const user = userResult.rows[0];
        const tokensRequired = 157000;  

        if (user.available_tokens < tokensRequired) {
            client.release();
            return res.status(403).json({ error: "Insufficient tokens." });
        }

        const musicResponse = await generateCustomMusic(prompt, tags, title, makeInstrumental, waitAudio);

        const newMusicIds = [musicResponse[0].id, musicResponse[1].id];

        const existingMusicQuery = `
            SELECT music_ids FROM user_music WHERE user_id = $1
        `;
        const existingMusicResult = await client.query(existingMusicQuery, [userId]);

        if (existingMusicResult.rows.length > 0) {
            const existingMusicIds = existingMusicResult.rows[0].music_ids;
            const updatedMusicIds = existingMusicIds.concat(newMusicIds);

            const updateMusicQuery = `
                UPDATE user_music
                SET music_ids = $1
                WHERE user_id = $2
            `;
            await client.query(updateMusicQuery, [JSON.stringify(updatedMusicIds), userId]);
        } else {
            const insertMusicQuery = `
                INSERT INTO user_music (user_id, music_ids)
                VALUES ($1, $2)
            `;
            await client.query(insertMusicQuery, [userId, JSON.stringify(newMusicIds)]);
        }

        const updateTokensQuery = `
            UPDATE users
            SET tokens_used = tokens_used + $1, available_tokens = available_tokens - $1
            WHERE id = $2
        `;
        await client.query(updateTokensQuery, [tokensRequired, userId]);

        const logQuery = `
            INSERT INTO usage_logs (user_id, bot_type, request, response, tokens_used)
            VALUES ($1, $2, $3, $4, $5)
           RETURNING id;
        `;
        const logResult = await client.query(logQuery, [userId, 'custom-music-generation', prompt, JSON.stringify(musicResponse), tokensRequired]);
        const logId = logResult.rows[0].id;
        await updateAiToolUsage(userId, model);
        await updateTokenUsagePoints(userId);
        await updateLoginStreak(userId);



        client.release();
        res.setHeader('Log-ID', logId); 


        return res.status(200).json({
            music1: {
                id: musicResponse[0].id,
                url: musicResponse[0].audio_url,
                image_url:musicResponse[0].image_url,
                title: musicResponse[0].title,
                model_name: musicResponse[0].model_name,
                tags: musicResponse[0].tags,
            },
            music2: {
                id: musicResponse[1].id,
                url: musicResponse[1].audio_url,
                image_url:musicResponse[1].image_url,
                title: musicResponse[1].title,
                model_name: musicResponse[1].model_name,
                tags: musicResponse[1].tags,
            },
            tokensUsed: tokensRequired
        });
    } catch (error) {
        console.error("Error in handleCustomMusicGenerationRequest:", error);
        return res.status(500).json({ error: "Failed to process custom music generation request." });
    }
};

module.exports = {
    handleMusicGenerationRequest,
    getUserMusicDetails,
    handleCustomMusicGenerationRequest
};

