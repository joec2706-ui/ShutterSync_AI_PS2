const chatService = require('../services/chatService');
const { ok, fail } = require('../utils/response');

exports.chat = async (req, res) => {
  try {
    const { message, history, profile, results } = req.body || {};
    if (!message || !message.trim()) {
      return fail(res, 400, 'INVALID_MESSAGE', 'Message is required.');
    }

    const response = await chatService.answerChat({
      message: message.trim(),
      history: history || [],
      profile: profile || {},
      results: results || null
    });

    return ok(res, response);
  } catch (err) {
    return fail(res, 500, 'CHAT_ERROR', err.message);
  }
};
