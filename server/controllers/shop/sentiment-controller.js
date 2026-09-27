const mlService = require("../../helpers/mlService");

const getReviewSentiment = async (req, res) => {
  try {
    const { reviewMessage } = req.body;
    if (!reviewMessage)
      return res.status(400).json({ success: false, message: "reviewMessage is required" });

    const result = await mlService.analyzeSentiment(reviewMessage);
    res.status(200).json({ success: true, sentiment: result.label, score: result.score });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "ML service error" });
  }
};

module.exports = { getReviewSentiment };
